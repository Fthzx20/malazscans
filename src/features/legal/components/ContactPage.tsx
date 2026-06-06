import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, BookOpen, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { useNovelStore } from '../../novels/store/novelStore';
import { getThemeStyles } from '../../reader/utils/theme';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters long')
});

type ContactInput = z.infer<typeof contactSchema>;

export const ContactPage: React.FC = () => {
  const { readerSettings } = useReaderStore();
  const { triggerToast } = useNovelStore();
  const themeStyles = getThemeStyles(readerSettings.theme);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (data: ContactInput) => {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitted(true);
    triggerToast("Inquiry sent successfully.");
    reset();
  };

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-current transition-colors duration-200">
      <div className="border-b border-[#262626] pb-4 space-y-1 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center justify-center gap-2">
          <Mail className="w-8 h-8 text-[#FF3D00]" />
          <span>Contact Us</span>
        </h1>
        <p className="text-xs font-mono text-[#737373]">Submit inquiries, translation corrections, or feedback directly to our team.</p>
      </div>

      <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6`}>
        {submitted ? (
          <div className="text-center py-8 space-y-4 font-mono text-xs">
            <CheckCircle className="w-12 h-12 text-[#FF3D00] mx-auto animate-bounce" />
            <h3 className="text-base font-black uppercase text-white">Inquiry Received</h3>
            <p className="text-[#A3A3A3] leading-relaxed max-w-sm mx-auto">
              Thank you for contacting MALAZ TL. Our team will review your submission and follow up with you at the email provided.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 border border-[#FF3D00] text-[#FF3D00] hover:bg-[#FF3D00] hover:text-[#0A0A0A] font-bold py-2.5 px-6 uppercase transition-all cursor-pointer font-mono text-xs bg-transparent"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-mono text-xs">
            {/* Name field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF3D00]" />
                <span>Your Name</span>
              </label>
              <input
                type="text"
                placeholder="Fatih..."
                className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-[10px] text-[#FF3D00] font-bold">{errors.name.message}</p>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FF3D00]" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                placeholder="yourname@domain.com"
                className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[10px] text-[#FF3D00] font-bold">{errors.email.message}</p>
              )}
            </div>

            {/* Subject field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#FF3D00]" />
                <span>Subject / Area</span>
              </label>
              <input
                type="text"
                placeholder="Translation error, copyright notice, bug report..."
                className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-[10px] text-[#FF3D00] font-bold">{errors.subject.message}</p>
              )}
            </div>

            {/* Message field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#737373] uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#FF3D00]" />
                <span>Your Message</span>
              </label>
              <textarea
                rows={5}
                placeholder="Write the details of your inquiry here..."
                className="w-full bg-[#151515] border border-[#262626] p-3 text-white focus:outline-none focus:border-[#FF3D00]"
                {...register('message')}
              ></textarea>
              {errors.message && (
                <p className="text-[10px] text-[#FF3D00] font-bold">{errors.message.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF3D00] text-[#0A0A0A] hover:bg-white disabled:opacity-50 text-xs font-bold py-3 uppercase transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending inquiry...' : 'Submit Inquiry'}</span>
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default ContactPage;
