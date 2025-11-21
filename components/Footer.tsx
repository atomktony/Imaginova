
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Footer = () => {
    return (
        <footer className="border-t border-white/10 bg-[#0b0b16] mt-32">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <a href="#" className="inline-flex items-center justify-center bg-center w-[120px] h-[36px] bg-[url(https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/56b2752b-f067-4093-be83-e35cac41ab92_320w.webp)] bg-cover rounded-full"></a>
                        <p className="text-white/60 text-sm font-poppins font-light tracking-normal leading-relaxed">
                            Professional AI Studio & Magic Editor. Transform your photos with cinematic lighting, advanced compositing, and studio-grade generation using Gemini 2.5.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            {/* Social Icons */}
                            {[1, 2, 3, 4].map((i) => (
                                <a key={i} href="#" className="text-white/60 hover:text-cyan-400 transition-colors duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h3 className="font-medium text-white tracking-normal font-poppins mb-4">Product</h3>
                        <ul className="space-y-3">
                            {['Studio Mode', 'Magic Editor', 'Founders Shoot', 'API', 'Roadmap'].map(item => (
                                <li key={item}><a href="#" className="text-white/60 hover:text-cyan-400 transition-colors duration-200 text-sm font-poppins font-light tracking-normal">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                        <h3 className="text-white font-poppins font-medium tracking-normal mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {['Documentation', 'Tutorials', 'Blog', 'Community', 'Support'].map(item => (
                                <li key={item}><a href="#" className="text-white/60 hover:text-cyan-400 transition-colors duration-200 text-sm font-poppins font-light tracking-normal">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h3 className="text-white font-poppins font-medium tracking-normal mb-4">Company</h3>
                        <ul className="space-y-3">
                            {['About', 'Careers', 'Press Kit', 'Contact', 'Partners'].map(item => (
                                <li key={item}><a href="#" className="text-white/60 hover:text-cyan-400 transition-colors duration-200 text-sm font-poppins font-light tracking-normal">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <p className="text-white/40 text-sm font-poppins font-light tracking-normal">
                        © 2024 Imaginova. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors duration-200 text-sm font-poppins font-light tracking-normal">Privacy Policy</a>
                        <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors duration-200 text-sm font-poppins font-light tracking-normal">Terms of Service</a>
                        <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors duration-200 text-sm font-poppins font-light tracking-normal">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
