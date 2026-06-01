import MeetingHistoryList from '@/components/MeetingHistoryList';

export default function MeetingHistoryPage() {
  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div>
        <h1 className="text-3xl font-bold lg:text-4xl">Meeting History</h1>
        <p className="mt-2 text-sky-1">
          Past meetings you hosted, stored in your database.
        </p>
      </div>
      <MeetingHistoryList />
    </section>
  );
}
