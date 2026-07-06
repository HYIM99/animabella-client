// components/BookingForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  name_it: string;
  price: number;
  duration_minutes: number;
}

export default function BookingForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service_id: '',
    date: '',
    time: ''
  });

  // 挂载时获取可用的服务项目
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name_it, price, duration_minutes')
        .eq('is_active', true);
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. 查找或创建客户 (基于手机号)
      let customerId = '';
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', formData.phone)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{ phone: formData.phone, name: formData.name }])
          .select()
          .single();
        
        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // 2. 组合预约时间 (ISO 格式)
      const appointmentDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      // 3. 插入预约记录
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          customer_id: customerId,
          service_id: formData.service_id,
          appointment_time: appointmentDateTime,
          source: 'online',
          status: 'pending' // 需商家后台确认才生效
        }]);

      if (appointmentError) throw appointmentError;

      setStep(3); // 跳转到成功页面
    } catch (error: any) {
      setMessage('Errore durante la prenotazione. Riprova.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-medium mb-2">Richiesta Inviata!</h2>
        <p className="text-gray-500 text-sm">
          La tua prenotazione è in attesa di conferma. Riceverai un messaggio a breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitBooking} className="flex flex-col gap-6">
      {step === 1 && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-500">
          <h2 className="text-lg font-medium text-center border-b pb-2">I Tuoi Dati</h2>
          
          <input
            type="text"
            name="name"
            placeholder="Nome e Cognome"
            required
            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-400"
            value={formData.name}
            onChange={handleInputChange}
          />
          
          <input
            type="tel"
            name="phone"
            placeholder="Numero di Telefono"
            required
            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent placeholder-gray-400"
            value={formData.phone}
            onChange={handleInputChange}
          />
          
          <button 
            type="button" 
            onClick={() => formData.name && formData.phone ? setStep(2) : setMessage('Compila tutti i campi')}
            className="mt-4 w-full bg-black text-white py-3 rounded-md font-medium tracking-wide hover:bg-gray-800 transition-colors"
          >
            Avanti
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-500">
          <div className="flex justify-between items-center border-b pb-2">
            <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-black text-sm">
              &larr; Indietro
            </button>
            <h2 className="text-lg font-medium">Servizio & Data</h2>
          </div>

          <select
            name="service_id"
            required
            className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-gray-700"
            value={formData.service_id}
            onChange={handleInputChange}
          >
            <option value="" disabled>Seleziona un servizio...</option>
            {services.map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.name_it} - €{srv.price}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="date"
              required
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-gray-700"
              value={formData.date}
              onChange={handleInputChange}
            />
            <input
              type="time"
              name="time"
              required
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-gray-700"
              value={formData.time}
              onChange={handleInputChange}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-black text-white py-3 rounded-md font-medium tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Elaborazione...' : 'Conferma Prenotazione'}
          </button>
        </div>
      )}

      {message && <p className="text-red-500 text-sm text-center mt-2">{message}</p>}
    </form>
  );
}
