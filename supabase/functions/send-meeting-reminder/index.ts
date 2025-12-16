import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  meeting_id: string;
  reminder_type: "confirmation" | "24h" | "1h";
}

interface Meeting {
  id: string;
  title: string;
  scheduled_for: string;
  status: string;
  contact_id: string | null;
  client_id: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

interface Client {
  id: string;
  name: string;
  meeting_link: string | null;
}

// Generate ICS calendar invite content
function generateICS(meeting: Meeting, client: Client): string {
  const start = new Date(meeting.scheduled_for);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min default
  
  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CallFlow Portal//Meeting//EN
BEGIN:VEVENT
UID:${meeting.id}@callflow
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${meeting.title}
DESCRIPTION:Meeting with ${client.name}
${client.meeting_link ? `URL:${client.meeting_link}` : ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

function getEmailContent(
  reminderType: string,
  meeting: Meeting,
  contact: Contact,
  client: Client
): { subject: string; html: string } {
  const meetingDate = new Date(meeting.scheduled_for);
  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  switch (reminderType) {
    case 'confirmation':
      return {
        subject: `Meeting Confirmed: ${meeting.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a2e;">Meeting Confirmed!</h1>
            <p>Hi ${contact.name},</p>
            <p>Your meeting has been confirmed. Here are the details:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Meeting:</strong> ${meeting.title}</p>
              <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
              ${client.meeting_link ? `<p style="margin: 0;"><strong>Link:</strong> <a href="${client.meeting_link}">${client.meeting_link}</a></p>` : ''}
            </div>
            <p>A calendar invite is attached to this email.</p>
            <p>Best regards,<br>${client.name}</p>
          </div>
        `,
      };
    case '24h':
      return {
        subject: `Reminder: ${meeting.title} tomorrow`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a2e;">See You Tomorrow!</h1>
            <p>Hi ${contact.name},</p>
            <p>This is a friendly reminder about your meeting tomorrow:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Meeting:</strong> ${meeting.title}</p>
              <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
              ${client.meeting_link ? `<p style="margin: 0;"><strong>Link:</strong> <a href="${client.meeting_link}">${client.meeting_link}</a></p>` : ''}
            </div>
            <p>Looking forward to speaking with you!</p>
            <p>Best regards,<br>${client.name}</p>
          </div>
        `,
      };
    case '1h':
      return {
        subject: `Starting Soon: ${meeting.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a2e;">Your Meeting Starts Soon!</h1>
            <p>Hi ${contact.name},</p>
            <p>Your meeting is starting in 1 hour:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Meeting:</strong> ${meeting.title}</p>
              <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
              ${client.meeting_link ? `
                <p style="margin: 0 0 15px 0;"><strong>Join here:</strong></p>
                <a href="${client.meeting_link}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Join Meeting</a>
              ` : ''}
            </div>
            <p>See you soon!</p>
            <p>Best regards,<br>${client.name}</p>
          </div>
        `,
      };
    default:
      return { subject: '', html: '' };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-meeting-reminder function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { meeting_id, reminder_type }: ReminderRequest = await req.json();
    console.log(`Processing reminder: ${reminder_type} for meeting ${meeting_id}`);

    // Fetch meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meeting_id)
      .single();

    if (meetingError || !meeting) {
      console.error("Meeting not found:", meetingError);
      return new Response(
        JSON.stringify({ error: "Meeting not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contact
    if (!meeting.contact_id) {
      console.log("No contact associated with meeting");
      return new Response(
        JSON.stringify({ error: "No contact associated with meeting" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", meeting.contact_id)
      .single();

    if (contactError || !contact || !contact.email) {
      console.error("Contact not found or no email:", contactError);
      return new Response(
        JSON.stringify({ error: "Contact not found or has no email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", meeting.client_id)
      .single();

    if (clientError || !client) {
      console.error("Client not found:", clientError);
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email content
    const { subject, html } = getEmailContent(reminder_type, meeting, contact, client);

    // Send email via Resend API
    console.log(`Sending ${reminder_type} email to ${contact.email}`);
    
    const emailPayload: any = {
      from: `${client.name} <onboarding@resend.dev>`,
      to: [contact.email],
      subject,
      html,
    };

    // Add ICS attachment for confirmation emails
    if (reminder_type === "confirmation") {
      const icsContent = generateICS(meeting, client);
      emailPayload.attachments = [
        {
          filename: "meeting.ics",
          content: btoa(icsContent),
        },
      ];
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }
    
    console.log("Email sent successfully:", emailResult);

    // Record the reminder
    await supabase.from("email_reminders").insert({
      meeting_id,
      reminder_type,
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-meeting-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
