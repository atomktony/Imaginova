
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface GalleryItemProps {
    url: string;
    title: string;
    delay?: number;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ url, title, delay = 0 }) => {
    
    const handleDownload = async () => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    return (
        <div 
            className="relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500 break-inside-avoid mb-6 animate-fade-in opacity-0 shadow-lg"
            style={{ animationDelay: `${delay}s` }}
        >
            <img 
                src={url} 
                alt={title} 
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                loading="lazy"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium font-poppins text-sm tracking-wide mb-1">{title}</h3>
                        <p className="text-white/40 text-xs font-light">Generated with Imaginova</p>
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={handleDownload}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10 group-hover:scale-110 active:scale-95"
                            title="Download Image"
                        >
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Top Badge */}
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                <span className="px-2 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded text-[10px] uppercase tracking-widest text-white/80 font-medium">
                    AI Art
                </span>
            </div>
        </div>
    );
};

export default GalleryItem;