'use client';

import { useEffect, useState, useRef } from 'react';
import { notification } from 'antd';
import { rrulestr } from 'rrule';
import dayjs from 'dayjs';
import api from '@/lib/axios';

export default function EventNotifier() {
  const [events, setEvents] = useState<any[]>([]);
  const notifiedEvents = useRef<Set<string>>(new Set());

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (error) {
      console.error('Failed to fetch events for notifier:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Poll every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const checkUpcomingEvents = () => {
      const now = new Date();
      const checkStart = dayjs(now).startOf('day').toDate();
      const checkEnd = dayjs(now).endOf('day').toDate();

      const expandedEvents: any[] = [];

      events.forEach((evt: any) => {
        if (evt.recurrenceRule) {
          try {
            const ruleString = evt.recurrenceRule.replace(/^RRULE:/, '');
            const rule = rrulestr(`RRULE:${ruleString}`, { dtstart: new Date(evt.startTime) });
            const occurrences = rule.between(checkStart, checkEnd, true);
            const originalDuration = new Date(evt.endTime).getTime() - new Date(evt.startTime).getTime();

            occurrences.forEach((occ: Date) => {
              expandedEvents.push({
                ...evt,
                start: occ,
                end: new Date(occ.getTime() + originalDuration),
              });
            });
          } catch (e) {
            // Ignore parse errors
          }
        } else {
          expandedEvents.push({
            ...evt,
            start: new Date(evt.startTime),
            end: new Date(evt.endTime),
          });
        }
      });

      expandedEvents.forEach(evt => {
        const diffMs = evt.start.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));

        // Notify if event starts in exactly 15 minutes, or between 0 and 15 mins if not notified yet
        if (diffMins > 0 && diffMins <= 15) {
          const notifyKey = `${evt.id}_${evt.start.getTime()}`;
          
          if (!notifiedEvents.current.has(notifyKey)) {
            notifiedEvents.current.add(notifyKey);

            const timeStr = dayjs(evt.start).format('HH:mm');
            const messageTitle = `Sự kiện sắp diễn ra`;
            const messageDesc = `"${evt.title}" sẽ bắt đầu lúc ${timeStr} (${diffMins} phút nữa).`;

            notification.info({
              message: messageTitle,
              description: messageDesc,
              placement: 'topRight',
              duration: 10,
            });

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(messageTitle, {
                body: messageDesc,
                icon: '/favicon.ico',
              });
            }
          }
        }
      });
    };

    checkUpcomingEvents();
    // Check every minute
    const interval = setInterval(checkUpcomingEvents, 60 * 1000);
    return () => clearInterval(interval);
  }, [events]);

  return null;
}
