import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface Meeting {
  id: string;
  title: string;
  scheduled_for: string | null;
  status: string;
  contact_name?: string | null;
}

interface MeetingsCalendarViewProps {
  meetings: Meeting[];
}

export function MeetingsCalendarView({ meetings }: MeetingsCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach((meeting) => {
      if (meeting.scheduled_for) {
        const dateKey = format(new Date(meeting.scheduled_for), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(meeting);
      }
    });
    return map;
  }, [meetings]);

  const selectedDateMeetings = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return meetingsByDate.get(dateKey) || [];
  }, [selectedDate, meetingsByDate]);

  const modifiers = useMemo(() => {
    const hasMeetings: Date[] = [];
    meetingsByDate.forEach((_, dateKey) => {
      hasMeetings.push(new Date(dateKey));
    });
    return { hasMeetings };
  }, [meetingsByDate]);

  const modifiersStyles = {
    hasMeetings: {
      fontWeight: 'bold',
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'no_show':
        return 'bg-rose-50 text-rose-700 border-rose-200/50';
      case 'cancelled':
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
      case 'rescheduled':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border pointer-events-auto"
            components={{
              DayContent: ({ date }) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const dayMeetings = meetingsByDate.get(dateKey);
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{date.getDate()}</span>
                    {dayMeetings && dayMeetings.length > 0 && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No meetings scheduled for this date.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{meeting.title}</p>
                      {meeting.contact_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meeting.contact_name}
                        </p>
                      )}
                      {meeting.scheduled_for && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(meeting.scheduled_for), 'h:mm a')}
                        </p>
                      )}
                    </div>
                    <Badge className={cn('text-xs capitalize', getStatusColor(meeting.status))}>
                      {meeting.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
