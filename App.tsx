
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import {
    generateStudioPortfolio,
    generateMagicPortfolio,
    generateFoundersPortfolio,
    CLASSIC_THEMES,
    STARTUP_THEMES,
    TROPICAL_THEMES
} from './services/geminiService';
import Footer from './components/Footer';
import GalleryItem from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import PosePanel from './components/PosePanel';

type Mode = 'portfolio' | 'editor' | 'founders';

const ASPECT_RATIOS = [
    "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"
];

const MODELS = [
    { id: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image (Nano Banana)" },
    { id: "flux-style", label: "Flux Style (Simulated)" }
];

const PHOTOSHOOT_STYLES = [
    { id: 'classic', label: 'Classic Studio', description: '3 distinct, high-end studio environments with varied lighting, outfits, and poses.' },
    { id: 'startup', label: 'Startup & Entrepreneur', description: '3 distinct, high-end startup & entrepreneur environments with varied lighting, business outfits, and poses.' },
    { id: 'tropical', label: 'Tropical Getaway', description: '3 distinct, high-end full body in tropical island environments with natural lighting, outfits, and angles.' }
];

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

function App() {
    // App State
    const [mode, setMode] = useState<Mode>('portfolio');

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    const [prompt, setPrompt] = useState("");

    // Upload State (Portfolio & Editor)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [portfolioModel, setPortfolioModel] = useState(MODELS[0].id);
    const [photoshootStyle, setPhotoshootStyle] = useState(PHOTOSHOOT_STYLES[0].id);

    // Founders Mode State
    const [founderAFile, setFounderAFile] = useState<File | null>(null);
    const [founderAPreview, setFounderAPreview] = useState<string | null>(null);
    const [founderBFile, setFounderBFile] = useState<File | null>(null);
    const [founderBPreview, setFounderBPreview] = useState<string | null>(null);

    // Editor Specific State
    const [objectFile, setObjectFile] = useState<File | null>(null);
    const [objectPreviewUrl, setObjectPreviewUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState("1:1");

    // Editor Adjustments
    const [brightness, setBrightness] = useState(50);
    const [contrast, setContrast] = useState(50);
    const [warmth, setWarmth] = useState(50);
    const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'layers' | null>(null);

    // Results State
    const [generatedResults, setGeneratedResults] = useState<{ theme: string, url: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectInputRef = useRef<HTMLInputElement>(null);
    const founderAInputRef = useRef<HTMLInputElement>(null);
    const founderBInputRef = useRef<HTMLInputElement>(null);

    // File Handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'object' | 'founderA' | 'founderB' = 'main') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);

            if (type === 'object') {
                setObjectFile(file);
                setObjectPreviewUrl(url);
            } else if (type === 'founderA') {
                setFounderAFile(file);
                setFounderAPreview(url);
            } else if (type === 'founderB') {
                setFounderBFile(file);
                setFounderBPreview(url);
            } else {
                setSelectedFile(file);
                setPreviewUrl(url);
            }
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Construct Adjustment String for Prompt
    const getAdjustmentString = () => {
        let parts = [];
        if (brightness > 60) parts.push("Bright high-key lighting");
        if (brightness < 40) parts.push("Dark moody low-key lighting");
        if (contrast > 60) parts.push("High dramatic contrast");
        if (contrast < 40) parts.push("Soft muted contrast");
        if (warmth > 60) parts.push("Warm golden color temperature");
        if (warmth < 40) parts.push("Cool blue cinematic tones");
        return parts.join(", ");
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError("");
        setGeneratedResults([]);

        try {
            // Ensure API Key is selected (Required for high-quality models)
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    await window.aistudio.openSelectKey();
                }
            }

            if (mode === 'portfolio') {
                if (!selectedFile) { setError("Please upload a main image."); return; }
                const mainBase64 = await convertToBase64(selectedFile);

                let selectedThemes = CLASSIC_THEMES;
                if (photoshootStyle === 'startup') selectedThemes = STARTUP_THEMES;
                if (photoshootStyle === 'tropical') selectedThemes = TROPICAL_THEMES;

                const results = await generateStudioPortfolio(mainBase64, selectedThemes, portfolioModel);
                setGeneratedResults(results);
            }
            else if (mode === 'editor') {
                if (!selectedFile) { setError("Please upload a main image."); return; }
                if (!prompt) { setError("Please describe your edit."); return; }

                const mainBase64 = await convertToBase64(selectedFile);
                let objectBase64;
                if (objectFile) objectBase64 = await convertToBase64(objectFile);

                const adjustments = getAdjustmentString();
                const results = await generateMagicPortfolio(mainBase64, prompt, adjustments, aspectRatio, objectBase64);
                setGeneratedResults(results);
            }
            else if (mode === 'founders') {
                if (!founderAFile || !founderBFile) { setError("Please upload photos for both founders."); return; }
                const aBase64 = await convertToBase64(founderAFile);
                const bBase64 = await convertToBase64(founderBFile);

                const results = await generateFoundersPortfolio(aBase64, bBase64);
                setGeneratedResults(results);
            }
        } catch (e: any) {
            // Check if it's a rate limit error
            if (e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
                setError("⚠️ API quota exceeded. Your free tier limit has been reached. Please wait 24 hours or upgrade your API key at aistudio.google.com");
            } else {
                setError(e.message || "Generation failed. Please try again.");
            }
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPortfolio = async () => {
        if (generatedResults.length === 0) return;
        try {
            const imageData = generatedResults.reduce((acc, curr) => ({ ...acc, [curr.theme]: curr.url }), {});
            const albumUrl = await createAlbumPage(imageData);
            const link = document.createElement('a');
            link.href = albumUrl;
            link.download = `imaginova-${mode}-${Date.now()}.jpg`;
            link.click();
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    const handlePoseSelect = (pose: string) => {
        setPrompt(prev => {
            const clean = prev.trim();
            return clean ? `${clean}. Change pose to: ${pose}` : `Change pose to: ${pose}`;
        });
    };

    // UI Components
    const ModeTab = ({ id, label, icon }: { id: Mode, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => { setMode(id); setError(""); setGeneratedResults([]); }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 font-medium text-sm ${mode === id
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const ToolButton = ({ tool, icon }: { tool: 'brush' | 'eraser' | 'layers', icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTool(tool === activeTool ? null : tool)}
            className={`p-3 rounded-lg transition-all ${activeTool === tool ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
        >
            {icon}
        </button>
    );

    const FileUploader = ({
        preview,
        onSelect,
        inputRef,
        label,
        mini = false
    }: {
        preview: string | null,
        onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
        inputRef: React.RefObject<HTMLInputElement | null>,
        label: string,
        mini?: boolean
    }) => (
        <div
            onClick={() => inputRef.current?.click()}
            className={`relative overflow-hidden border-dashed border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group hover:border-cyan-400 hover:bg-white/5 ${mini ? 'h-32 w-32 min-w-[8rem]' : 'h-64 w-full'
                } ${preview ? 'border-solid border-white/50' : ''}`}
        >
            <input type="file" ref={inputRef} onChange={onSelect} accept="image/*" className="hidden" />

            {preview ? (
                <>
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    <div className="relative z-10 p-2 bg-black/60 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
                    </div>
                </>
            ) : (
                <div className="p-4 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width={mini ? 24 : 32} height={mini ? 24 : 32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 mb-3 group-hover:text-cyan-400 transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                    <span className="text-white/60 text-sm font-light">{label}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen font-inter">
            {/* Aura Background */}
            <div className="aura-background-component w-full top-0 absolute h-[900px] saturate-50 pointer-events-none" data-alpha-mask="80" style={{ maskImage: "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)" }}>
                <div data-us-project="mZq7XpvHyoo5yklnnqL9" className="absolute w-full h-full left-0 top-0 -z-10">
                    <div data-us-text="id-mdi69c91dlpevrz7ugb7me" style={{ width: '1160.32px', top: '311.702px', left: '203.84px', fontSize: '282.24px', lineHeight: '276.595px', letterSpacing: '-8.95337px', fontFamily: 'Outfit', fontWeight: 400, textAlign: 'center', position: 'absolute', wordBreak: 'break-word', transform: 'rotateZ(0deg)', color: 'transparent', zIndex: 2 }}>IMAGI</div>
                </div>
            </div>

            {/* Navigation */}
            <header className="animate-fade-in opacity-0 w-full z-50 relative">
                <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
                    <a href="#" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        IMAGINOVA
                    </a>
                    <div className="hidden md:flex items-center space-x-10 text-sm font-medium">
                        <a href="#" className="text-cyan-400 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400 font-poppins font-light">Studio</a>
                        <a href="#" className="text-white/60 hover:text-white font-poppins font-light">Pro</a>
                    </div>
                </nav>
            </header>

            {/* Studio Main Area */}
            <section className="relative z-10 pt-10 pb-20">
                <div className="max-w-6xl mx-auto px-6">

                    {/* Mode Switcher */}
                    <div className="flex justify-center mb-12 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
                        <div className="bg-white/5 border border-white/10 p-1 rounded-full flex space-x-1 backdrop-blur-md">
                            <ModeTab id="portfolio" label="Portfolio" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>} />
                            <ModeTab id="founders" label="Founders Shoot" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} />
                            <ModeTab id="editor" label="Magic Editor" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>} />
                        </div>
                    </div>

                    {/* Mode Content */}
                    <div className="animate-scale-in opacity-0" style={{ animationDelay: '0.2s' }}>

                        {/* PORTFOLIO MODE */}
                        {mode === 'portfolio' && (
                            <div className="max-w-3xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <FileUploader
                                        preview={previewUrl}
                                        onSelect={(e) => handleFileSelect(e)}
                                        inputRef={fileInputRef}
                                        label="Upload Subject Photo"
                                    />
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-playfair mb-2">Studio Session</h3>
                                            <p className="text-white/60 text-sm mb-6">
                                                {PHOTOSHOOT_STYLES.find(s => s.id === photoshootStyle)?.description}
                                            </p>

                                            <div className="mb-4">
                                                <label className="text-xs font-medium text-white/40 block mb-2">Photoshoot Style</label>
                                                <select
                                                    value={photoshootStyle}
                                                    onChange={(e) => setPhotoshootStyle(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 text-white/80"
                                                >
                                                    {PHOTOSHOOT_STYLES.map(s => (
                                                        <option key={s.id} value={s.id} className="bg-[#0b0b16]">{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-6">
                                                <label className="text-xs font-medium text-white/40 block mb-2">Generative Model</label>
                                                <select
                                                    value={portfolioModel}
                                                    onChange={(e) => setPortfolioModel(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 text-white/80"
                                                >
                                                    {MODELS.map(m => (
                                                        <option key={m.id} value={m.id} className="bg-[#0b0b16]">{m.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Includes</h4>
                                                <ul className="space-y-2 text-xs text-white/70">
                                                    {photoshootStyle === 'classic' && (
                                                        <>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Professional Headshot</li>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>High Fashion Editorial</li>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Cinematic 85mm Close-up</li>
                                                        </>
                                                    )}
                                                    {photoshootStyle === 'startup' && (
                                                        <>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Modern Open Office</li>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Keynote Stage Presentation</li>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Urban Rooftop Golden Hour</li>
                                                        </>
                                                    )}
                                                    {photoshootStyle === 'tropical' && (
                                                        <>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>White Sand Beach Walk</li>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Luxury Resort Infinity Pool</li>
                                                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-white/40 rounded-full mr-2"></span>Bamboo Forest Zen</li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FOUNDERS MODE */}
                        {mode === 'founders' && (
                            <div className="max-w-4xl mx-auto">
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-playfair mb-2">Founders Shoot</h3>
                                    <p className="text-white/60 text-sm">Upload photos of two co-founders to generate a professional collaborative portfolio.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider text-center">Founder A</h4>
                                        <FileUploader
                                            preview={founderAPreview}
                                            onSelect={(e) => handleFileSelect(e, 'founderA')}
                                            inputRef={founderAInputRef}
                                            label="Upload Founder A"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider text-center">Founder B</h4>
                                        <FileUploader
                                            preview={founderBPreview}
                                            onSelect={(e) => handleFileSelect(e, 'founderB')}
                                            inputRef={founderBInputRef}
                                            label="Upload Founder B"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EDITOR MODE */}
                        {mode === 'editor' && (
                            <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col md:flex-row">
                                {/* Left: Canvas / Preview */}
                                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-medium uppercase tracking-wider text-white/40">Canvas</span>
                                        <div className="flex space-x-2">
                                            <ToolButton tool="brush" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13.28A4.41 4.41 0 0 0 20.5 11c.58-.82.26-2.16-.68-2.56a16.5 16.5 0 0 0-5.64-.65 16.67 16.67 0 0 0-6 1.4 4.39 4.39 0 0 0-2.18 3.62c.27 2.87 3.2 4.19 6 4.19 4.6 0 6.56-2.32 6-3.72z" /></svg>} />
                                            <ToolButton tool="eraser" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z" /><path d="M17 17L7 7" /></svg>} />
                                            <ToolButton tool="layers" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>} />
                                        </div>
                                    </div>
                                    <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Main" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <p className="text-white/40 text-sm">Click to load base image</p>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e)} accept="image/*" className="hidden" />

                                        {/* Overlay Object if present */}
                                        {objectPreviewUrl && (
                                            <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-cyan-500/50 rounded-lg overflow-hidden bg-black/50">
                                                <img src={objectPreviewUrl} alt="Ref" className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        {/* Loading Overlay */}
                                        {isGenerating && (
                                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <div className="relative mb-4">
                                                    <div className="w-16 h-16 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                                    </div>
                                                </div>
                                                <p className="text-cyan-400 font-medium font-mono text-sm animate-pulse tracking-wider">PROCESSING SCENE...</p>
                                                <p className="text-white/40 text-xs mt-2">Optimizing lighting & composition</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Controls */}
                                <div className="w-full md:w-80 p-6 space-y-8 flex flex-col h-full overflow-y-auto">
                                    {/* Inputs */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-white/80">Inputs</h4>
                                        <div
                                            className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                                            onClick={() => objectInputRef.current?.click()}
                                        >
                                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                            </div>
                                            <span className="text-xs text-white/60">{objectFile ? objectFile.name.slice(0, 15) : "Add Reference Object"}</span>
                                            <input type="file" ref={objectInputRef} onChange={(e) => handleFileSelect(e, 'object')} accept="image/*" className="hidden" />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-white/40">Prompt</label>
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Describe your edit..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 resize-none h-24"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-white/40">Aspect Ratio</label>
                                            <select
                                                value={aspectRatio}
                                                onChange={(e) => setAspectRatio(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 text-white/80"
                                            >
                                                {ASPECT_RATIOS.map(ratio => (
                                                    <option key={ratio} value={ratio} className="bg-[#0b0b16]">{ratio}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Adjustments */}
                                    <div className="space-y-5">
                                        <h4 className="text-sm font-medium text-white/80">Adjustments</h4>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-white/40">
                                                <span>Brightness</span> <span>{brightness}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-white/40">
                                                <span>Contrast</span> <span>{contrast}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-white/40">
                                                <span>Warmth</span> <span>{warmth}%</span>
                                            </div>
                                            <input type="range" min="0" max="100" value={warmth} onChange={(e) => setWarmth(Number(e.target.value))} />
                                        </div>
                                    </div>

                                    <PosePanel onPoseSelect={handlePoseSelect} isLoading={isGenerating} />
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className="mt-10 flex justify-center flex-col items-center">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="group relative px-8 py-4 bg-white text-black rounded-full font-medium text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center space-x-2">
                                    {isGenerating ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Generate {mode === 'editor' ? 'Magic Set' : mode === 'founders' ? 'Founder Duo' : 'Portfolio'}</span>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-300 to-blue-300 opacity-0 group-hover:opacity-100 blur-lg transition-opacity -z-10"></div>
                            </button>
                            {error && <p className="text-red-400 mt-4 animate-fade-in bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>}
                        </div>
                    </div>
                </div>
            </section>

            {/* RESULTS SECTION */}
            {generatedResults.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 pb-20 animate-slide-up">
                    <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-3xl font-playfair">{mode === 'editor' ? 'Magic Edit Results' : mode === 'founders' ? 'Founders Session' : 'Studio Session'}</h2>
                            <p className="text-white/40 text-sm mt-1">{generatedResults.length} unique variations generated</p>
                        </div>
                        <button
                            onClick={handleDownloadPortfolio}
                            className="flex items-center space-x-2 text-sm font-medium text-cyan-400 hover:text-white transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            <span>Download All</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {generatedResults.map((img, idx) => (
                            <GalleryItem key={idx} url={img.url} title={img.theme} delay={idx * 0.1} />
                        ))}
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}

export default App;
