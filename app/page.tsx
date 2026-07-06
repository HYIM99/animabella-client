// app/page.tsx
import BookingForm from '@/components/BookingForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-[0_4px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-widest mb-2 uppercase">Anima Bella</h1>
          <p className="text-gray-400 text-sm tracking-wide">STUDIO NAILS</p>
        </div>
        
        <BookingForm />
      </div>
    </main>
  );
}
