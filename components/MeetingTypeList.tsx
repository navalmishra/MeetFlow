'use client';
import React, { useState } from 'react';
import HomeCard from './HomeCard';
import { useRouter } from 'next/navigation';
import MeetingModal from './MeetingModal';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { saveMeetingRecord } from '@/actions/meeting.actions';
import { getMeetingLink } from '@/lib/meeting-link';
import type { MeetingType } from '@/types/meeting';

function MeetingTypeList() {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [values, setValues] = useState({
    dateTime: new Date(),
    description: '',
    link: ''
  });
  const [callDetails, setCallDetails] = useState<Call>();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const createMeeting = async () => {
    if (!client || !user || isCreating) return;

    setIsCreating(true);
    try {
      if (!values.dateTime) {
        toast({ title: 'Please select date and time' });
        return;
      }
      const id = crypto.randomUUID(); // Generate unique call ID
      const call = client.call('default', id);

      if (!call) throw new Error('Call not created');
      
      const startsAt = values.dateTime.toISOString();
      const description = values.description || 'Instant Meeting';

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: { description },
        },
      });

      const meetingType: MeetingType =
        meetingState === 'isScheduleMeeting' ? 'scheduled' : 'instant';

      const saved = await saveMeetingRecord({
        streamCallId: call.id,
        title: description,
        type: meetingType,
        startsAt,
      });

      setCallDetails(call);

      const hasDescription = Boolean(values.description.trim());

      if (meetingType === 'instant') {
        setMeetingState(undefined);
        router.push(`/meeting/${call.id}`);
      } else if (!hasDescription) {
        setMeetingState(undefined);
        router.push(`/meeting/${call.id}`);
      }
      // Scheduled with description: keep modal open for "Copy Meeting Link".

      toast({
        title: 'Meeting Created',
        description: saved
          ? undefined
          : 'Video room is ready. Meeting history was not saved — check MongoDB / Atlas IP access.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to create meeting',
        description:
          error instanceof Error ? error.message : 'Check Stream API keys and connection.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const meetingLink = callDetails?.id
    ? getMeetingLink(callDetails.id)
    : '';

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-1 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState('isInstantMeeting')}
        className="bg-orange-1"
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        handleClick={() => setMeetingState('isScheduleMeeting')}
        className="bg-blue-1"
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Check out your recordings"
        handleClick={() => router.push('/recordings')}
        className="bg-purple-1"
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="Via invitation link"
        handleClick={() => setMeetingState('isJoiningMeeting')}
        className="bg-yellow-1"
      />
      {!callDetails ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => {
            setMeetingState(undefined);
            setCallDetails(undefined);
          }}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image="/icons/copy.svg"
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        >
          <Button
            type="button"
            className="mt-2 w-full bg-green-500"
            onClick={() => {
              if (callDetails?.id) {
                router.push(`/meeting/${callDetails.id}`);
              }
            }}
          >
            Join now
          </Button>
        </MeetingModal>
      )}

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>
      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
      />
    </section>
  );
}

export default MeetingTypeList;
