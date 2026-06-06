import React from 'react';
import { ShieldAlert, FileText, Send, HelpCircle, Mail, Info } from 'lucide-react';
import { useReaderStore } from '../../reader/store/readerStore';
import { getThemeStyles } from '../../reader/utils/theme';

export const DmcaPage: React.FC = () => {
  const { readerSettings } = useReaderStore();
  const themeStyles = getThemeStyles(readerSettings.theme);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-current transition-colors duration-200">
      <div className="border-b border-[#262626] pb-4 space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-[#FF3D00]" />
          <span>DMCA Copyright Policy</span>
        </h1>
        <p className="text-xs font-mono text-[#737373]">Review our digital rights management policies, infringement reporting protocols, and counter-notices.</p>
      </div>

      <div className="space-y-6 font-sans">
        {/* Copyright Policy */}
        <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-3`}>
          <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-[#FF3D00]">
            <FileText className="w-4 h-4" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider">1. Copyright Policy</h3>
          </div>
          <p className="text-xs leading-relaxed text-[#D4D4D4]">
            MALAZ TL respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 (DMCA), we will respond expeditiously to claims of copyright infringement committed using our service that are reported to our designated copyright agent.
          </p>
        </section>

        {/* Reporting Infringement */}
        <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-3`}>
          <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-[#FF3D00]">
            <Send className="w-4 h-4" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider">2. Reporting Infringement</h3>
          </div>
          <p className="text-xs leading-relaxed text-[#D4D4D4] space-y-2">
            If you are a copyright owner, authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the site by completing a DMCA Notice of Alleged Infringement and delivering it to our designated agent.
          </p>
          <div className="bg-[#151515] p-3 border border-[#262626] text-[11px] font-mono text-[#A3A3A3] space-y-1">
            <span className="text-[#FF3D00] font-bold block mb-1 uppercase text-[10px]">Your notice must include:</span>
            <div>- Identification of the copyrighted work claimed to have been infringed.</div>
            <div>- Identification of the material that is claimed to be infringing (URL link).</div>
            <div>- Your contact address, telephone number, and email.</div>
            <div>- A statement of good faith belief that the use is not authorized.</div>
            <div>- A statement under penalty of perjury that the information is accurate and you are the owner.</div>
          </div>
        </section>

        {/* Counter Notification Process */}
        <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-3`}>
          <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-[#FF3D00]">
            <HelpCircle className="w-4 h-4" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider">3. Counter Notification Process</h3>
          </div>
          <p className="text-xs leading-relaxed text-[#D4D4D4]">
            If you believe that your content was removed or disabled by mistake or misidentification, you may file a counter-notification with us. Upon receipt of a valid counter-notice, we will forward it to the original complaining party. The removed content may be restored in 10 to 14 business days unless the copyright owner files a lawsuit against you.
          </p>
        </section>

        {/* Contact Information */}
        <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-3`}>
          <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-[#FF3D00]">
            <Mail className="w-4 h-4" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider">4. Contact Information</h3>
          </div>
          <p className="text-xs leading-relaxed text-[#D4D4D4]">
            Please submit all DMCA notices and counter-notifications to our designated Copyright Agent at:
          </p>
          <div className="bg-[#151515] p-3 border border-[#262626] text-[11px] font-mono text-[#FAFAFA]">
            <div>MALAZ TL Copyright Agent</div>
            <div>Email: <span className="text-[#FF3D00]">malazscans@gmail.com</span></div>
            <div>Subject line: DMCA Copyright Infringement Notice</div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className={`border ${themeStyles.border} ${themeStyles.cardBg} p-6 space-y-3`}>
          <div className="flex items-center gap-2 border-b border-[#262626] pb-2 text-[#FF3D00]">
            <Info className="w-4 h-4" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider">5. Disclaimer</h3>
          </div>
          <p className="text-xs leading-relaxed text-[#D4D4D4]">
            The information presented on this page is for informational purposes only and does not constitute legal advice. We recommend consulting with a qualified legal professional if you have doubts or disputes regarding copyright claims.
          </p>
        </section>
      </div>
    </main>
  );
};

export default DmcaPage;
