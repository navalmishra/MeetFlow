'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { getMeetingHistory } from '@/actions/meeting.actions';
import { getMeetingLink } from '@/lib/meeting-link';
import type { MeetingRecord } from '@/types/meeting';
import Loader from './Loader';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

function formatDuration(startsAt: string, endedAt?: string) {
  if (!endedAt) return '—';
  const ms = new Date(endedAt).getTime() - new Date(startsAt).getTime();
  if (ms < 0) return '—';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

const typeLabels: Record<MeetingRecord['type'], string> = {
  instant: 'Instant',
  scheduled: 'Scheduled',
  personal: 'Personal room',
};

function MeetingHistoryCard({ meeting }: { meeting: MeetingRecord }) {
  const router = useRouter();
  const { toast } = useToast();
  const link = getMeetingLink(
    meeting.streamCallId,
    meeting.type === 'personal'
  );
  const started = new Date(meeting.startsAt).toLocaleString();
  const ended = meeting.endedAt
    ? new Date(meeting.endedAt).toLocaleString()
    : '—';

  return (
    <section className="flex min-h-[220px] w-full flex-col justify-between rounded-[14px] bg-dark-1 px-5 py-6 xl:max-w-[568px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <Image src="/icons/previous.svg" alt="" width={28} height={28} />
          <span className="rounded-full bg-dark-3 px-3 py-1 text-xs font-medium text-sky-1">
            {typeLabels[meeting.type]}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{meeting.title}</h2>
          <p className="mt-1 text-sm text-sky-2">Host: {meeting.hostName}</p>
        </div>
        <dl className="grid gap-2 text-sm text-sky-1">
          <div className="flex justify-between gap-4">
            <dt>Started</dt>
            <dd className="text-right text-white">{started}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Ended</dt>
            <dd className="text-right text-white">{ended}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Duration</dt>
            <dd className="text-right text-white">
              {formatDuration(meeting.startsAt, meeting.endedAt)}
            </dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          className="bg-blue-1"
          onClick={() =>
            router.push(
              `/meeting/${meeting.streamCallId}${
                meeting.type === 'personal' ? '?personal=true' : ''
              }`
            )
          }
        >
          View meeting
        </Button>
        <Button
          className="bg-dark-4"
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast({ title: 'Link copied' });
          }}
        >
          <Image src="/icons/copy.svg" alt="" width={16} height={16} />
          &nbsp; Copy link
        </Button>
      </div>
    </section>
  );
}

export default function MeetingHistoryList() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMeetingHistory();
        setMeetings(data);
      } catch {
        setError(
          'Unable to load meeting history. In MongoDB Atlas, add your IP under Network Access (or use 0.0.0.0/0 for development).'
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <p className="text-lg text-red-400" role="alert">
        {error}
      </p>
    );
  }

  if (meetings.length === 0) {
    return (
      <p className="text-2xl font-bold text-white">
        No completed meetings yet. Host a meeting to see it here after you leave.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {meetings.map((meeting) => (
        <MeetingHistoryCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
