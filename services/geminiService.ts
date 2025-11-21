
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

export const CLASSIC_THEMES = [
    "Professional Headshot: Seamless light grey paper background, wearing sharp formal business attire, soft even lighting",
    "Dramatic Portrait: Dark brown textured canvas background, wearing a black turtleneck, moody Rembrandt lighting",
    "High Fashion Editorial: Pure white infinity cyclorama background, wearing a stylish colorful blazer, high-key lighting",
    "Casual Lifestyle: Beige textured plaster wall background, wearing a denim jacket and white t-shirt, relaxed pose sitting on a stool",
    "Cinematic Close-up: 85mm lens, dark blurred studio background, detailed facial features, shallow depth of field (bokeh)",
    "Film Noir: Shadowy blinds pattern on background, wearing a classic trench coat, dramatic black and white high contrast"
];

export const STARTUP_THEMES = [
    "Modern Open Office: Leaning against a glass wall in a high-tech workspace, smart casual blazer, bright daylight",
    "Co-working Lounge: Relaxed confident pose on a modern sofa, laptop visible in background, blurred office depth of field",
    "Keynote Stage: Spotlight on subject, dark blurred audience background, wearing a modern suit, gesture of public speaking",
    "Urban Rooftop: City skyline background at golden hour, arms folded confidently, wearing a tech hoodie and jacket",
    "Minimalist Meeting Room: Whiteboard background with diagrams, standing pose, gesture of explaining idea, crisp lighting",
    "Coffee Shop Strategy: Window seat with city reflection, natural soft light, looking out thoughtfully, holding a notebook"
];

export const TROPICAL_THEMES = [
    "White Sand Beach: Walking towards camera, turquoise water background, wearing light linen outfit, bright sunny lighting",
    "Jungle Waterfall: Dappled sunlight through palm leaves, adventurous standing pose, lush green background",
    "Luxury Resort Pool: Infinity pool edge at sunset, elegant summer evening wear, warm golden lighting, relaxed pose",
    "Bamboo Forest: Path through tall bamboo, soft diffused zen lighting, yoga or meditation inspired standing pose",
    "Wooden Dock: Wide angle shot on a pier over water, breezy atmosphere, blue sky background, casual summer clothes",
    "Tiki Torch Night: Evening beach setting with firelight glow, dramatic warm shadows, festive tropical attire"
];

export const CREATIVE_THEMES = [
    "Double Exposure with Nature",
    "Cyberpunk Neon Studio",
    "Pop Art Illustration Style",
    "Vintage Polaroid Aesthetic",
    "Oil Painting Portrait",
    "Futuristic Hologram"
];

export const EDITOR_LENSES = [
    "35mm Wide Angle Editorial",
    "85mm Portrait Lens (Bokeh)",
    "Low Angle Hero Shot",
    "Overhead High Angle",
    "Cinematic Close-up Detail",
    "Side Profile Silhouette"
];

export const FOUNDER_THEMES = [
    "Executive Studio Power Duo: Seamless charcoal grey background, both subjects standing side-by-side with confident folded arms, matching professional business attire, sharp studio lighting",
    "Modern Tech Office: Blurred glass walls and open plan office in background, subjects collaborating over a tablet or document, dynamic interaction, natural daylight",
    "Urban Startup Lifestyle: City skyline depth of field background (bokeh), subjects walking or standing casually, smart-casual tech hoodies/blazers, golden hour lighting"
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to clean base64 strings
 */
const cleanBase64 = (data: string) => data.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

/**
 * Core function to generate a single image based on inputs and prompt
 */
async function generateSingleImage(
    mainImageBase64: string, 
    prompt: string, 
    secondImageBase64?: string,
    secondImageInstruction: string = "Use the second image as a reference object/style.",
    aspectRatio?: string,
    isRetry: boolean = false,
    modelName: string = 'gemini-2.5-flash-image'
): Promise<string> {
    // Initialize client inside function to ensure we get the latest process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];

    // 1. Add Main Image
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(mainImageBase64) } });

    // 2. Add Optional Second Image (Object or Person B)
    if (secondImageBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(secondImageBase64) } });
        parts.push({ text: secondImageInstruction });
    }

    // 3. Handle Model Selection & "Flux" Simulation
    let effectiveModel = modelName;
    let effectivePrompt = prompt;

    if (modelName === 'flux-style') {
        effectiveModel = 'gemini-2.5-flash-image';
        // Inject Flux Aesthetic Prompt Modifiers
        effectivePrompt = `${prompt}. Style: Hyper-realistic, 8k resolution, sharp focus, highly detailed skin texture, natural lighting, depth of field, film grain, cinematic composition, masterpiece, trending on ArtStation.`;
    } else {
         effectivePrompt = isRetry 
            ? `Edit this image. ${prompt}` 
            : `${prompt}. High quality, professional photography, 8k resolution.`;
    }

    parts.push({ text: effectivePrompt });

    const config: any = {
        responseModalities: [Modality.IMAGE],
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
    };

    if (aspectRatio) {
        config.imageConfig = { aspectRatio };
    }

    try {
        const response = await ai.models.generateContent({
            model: effectiveModel,
            contents: { parts },
            config: config
        });

        const candidates = response.candidates;
        if (candidates && candidates[0]) {
            const candidate = candidates[0];
            
            // Check for safety blocking
            if (candidate.finishReason === 'SAFETY') {
                // If strict prompt failed, throw specific error to trigger retry
                 throw new Error('SAFETY_BLOCK');
            }
            
            // Check for other stop reasons like IMAGE_OTHER
             if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                 throw new Error(`FINISH_REASON_${candidate.finishReason}`);
            }

            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:image/jpeg;base64,${part.inlineData.data}`;
                    }
                }
            }
        }
        
        if (response.text) {
            throw new Error(`Model Response: ${response.text.slice(0, 200)}...`);
        }
        
        throw new Error("No image generated.");
    } catch (error: any) {
        // Retry Logic for Safety or Unclear Reasons
        if (!isRetry && (error.message === 'SAFETY_BLOCK' || error.message?.includes('IMAGE_OTHER') || error.message?.includes('FINISH_REASON'))) {
            console.warn(`Generation failed with ${error.message}. Retrying with simplified prompt...`);
            return generateSingleImage(mainImageBase64, prompt.split('.')[0], secondImageBase64, secondImageInstruction, aspectRatio, true, effectiveModel);
        }
        
        // Note: 429 Errors are bubbled up to be handled by the loop-level retry mechanism
        throw error;
    }
}

/**
 * Generates a portfolio of 6 images sequentially (Classic/Creative Themes)
 */
export async function generateStudioPortfolio(
    base64Image: string, 
    themes: string[],
    modelName: string = 'gemini-2.5-flash-image'
): Promise<{ theme: string; url: string }[]> {
    const results: { theme: string; url: string }[] = [];

    for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];
        
        // Increased Base Delay to 20s to avoid hitting QPM limits
        if (i > 0) await delay(20000); 

        const specificPrompt = `
            Task: Edit the input image to change the background and lighting.
            Target Style: ${theme}.
            Instructions:
            - Keep the person from the original photo.
            - Replace the background completely to match the Target Style.
            - Update the lighting to match the Target Style.
            - If the style specifies clothes, change the outfit.
            - Photorealistic result.
        `;

        // Robust Retry Loop for 429 & 503 Errors
        let attempts = 0;
        const maxAttempts = 4;
        let success = false;

        while (attempts < maxAttempts && !success) {
            try {
                const url = await generateSingleImage(base64Image, specificPrompt, undefined, undefined, undefined, false, modelName);
                results.push({ theme, url });
                success = true;
            } catch (error: any) {
                // Check for Rate Limit (429) or Service Unavailable (503)
                if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.code === 429 || error.message?.includes('503')) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Exponential backoff: 30s, 60s, 90s, 120s
                        const backoffTime = 30000 * attempts;
                        console.warn(`API Limit for '${theme}'. Pausing ${backoffTime/1000}s before retry ${attempts}/${maxAttempts}...`);
                        await delay(backoffTime);
                    } else {
                         console.error(`Failed '${theme}' after ${maxAttempts} attempts.`);
                    }
                } else {
                    // Other errors (like persistent SAFETY) -> Skip to next theme
                    console.warn(`Skipping theme '${theme}' due to error:`, error.message);
                    break;
                }
            }
        }
    }

    if (results.length === 0) throw new Error("Failed to generate images. Please check your API quota or try a different photo.");
    return results;
}

/**
 * Generates a Magic Editor portfolio (6 images) with Angles/Lenses + Adjustments
 * Acts as Creative Director to ensure variety and product focus.
 */
export async function generateMagicPortfolio(
    mainImageBase64: string, 
    userPrompt: string, 
    adjustments: string,
    aspectRatio: string,
    objectImageBase64?: string
): Promise<{ theme: string; url: string }[]> {
    const results: { theme: string; url: string }[] = [];
    
    // Clone the lenses so we can modify one for the product shot
    const currentLenses = [...EDITOR_LENSES];

    // If a reference object is provided, we designate the 5th shot (index 4) as the Product Hero shot
    if (objectImageBase64) {
        currentLenses[4] = "Product Feature Macro: Hero shot of the reference object/product in focus";
    }

    for (let i = 0; i < currentLenses.length; i++) {
        const lens = currentLenses[i];
        
        // Increased Base Delay to 20s
        if (i > 0) await delay(20000); 

        let secondImagePrompt = "Use the second image as a reference object integrated naturally into the scene.";
        const isProductShot = objectImageBase64 && i === 4;

        if (isProductShot) {
            secondImagePrompt = "This is the HERO PRODUCT. Render it with extreme detail, placed prominently in the composition. The main subject should be secondary (blurred or interacting with it).";
        }

        const combinedPrompt = `
            ROLE: Creative Director.
            TASK: Edit the image based on: "${userPrompt}".
            SPECIFICATION:
            - Lens/Angle: ${lens}.
            - Adjustments: ${adjustments}.
            
            Directives:
            1. Change the perspective to match the '${lens}'.
            2. ${isProductShot ? "Focus primarily on the inserted object." : "Keep the subject consistent."}
            3. Ensure photorealistic commercial quality.
        `;

        // Robust Retry Loop
        let attempts = 0;
        const maxAttempts = 4;
        let success = false;

        while (attempts < maxAttempts && !success) {
            try {
                const url = await generateSingleImage(
                    mainImageBase64, 
                    combinedPrompt, 
                    objectImageBase64, 
                    secondImagePrompt,
                    aspectRatio
                );
                results.push({ theme: lens, url });
                success = true;
            } catch (error: any) {
                if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.code === 429 || error.message?.includes('503')) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Exponential backoff
                        const backoffTime = 30000 * attempts;
                        console.warn(`API Limit for '${lens}'. Pausing ${backoffTime/1000}s before retry ${attempts}/${maxAttempts}...`);
                        await delay(backoffTime);
                    }
                } else {
                    console.warn(`Skipping lens '${lens}' due to error:`, error.message);
                    break;
                }
            }
        }
    }

    if (results.length === 0) throw new Error("Failed to generate magic portfolio. Please try again later.");
    return results;
}

/**
 * Generates a Founders Shoot portfolio (3 images) combining two people
 */
export async function generateFoundersPortfolio(
    founderABase64: string,
    founderBBase64: string
): Promise<{ theme: string; url: string }[]> {
    const results: { theme: string; url: string }[] = [];
    const themes = FOUNDER_THEMES;

    for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];

        // Increased Base Delay to 20s
        if (i > 0) await delay(20000);

        const prompt = `
            Task: Create a composite image of two people together.
            Subject A: From Image 1.
            Subject B: From Image 2.
            Setting: ${theme}.
            
            Instructions:
            - Combine Subject A and Subject B into the same scene.
            - Ensure lighting matches the Setting.
            - Maintain resemblance of both subjects.
            - High-quality corporate photography.
        `;

        // Robust Retry Loop
        let attempts = 0;
        const maxAttempts = 4;
        let success = false;

        while (attempts < maxAttempts && !success) {
            try {
                const url = await generateSingleImage(
                    founderABase64, 
                    prompt, 
                    founderBBase64, 
                    "Use this image as Subject B.", 
                    "16:9" // Cinematic aspect ratio for duo shots
                );
                results.push({ theme, url });
                success = true;
            } catch (error: any) {
                if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || error.code === 429 || error.message?.includes('503')) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Exponential backoff
                        const backoffTime = 30000 * attempts;
                        console.warn(`API Limit for '${theme}'. Pausing ${backoffTime/1000}s before retry ${attempts}/${maxAttempts}...`);
                        await delay(backoffTime);
                    }
                } else {
                    console.warn(`Skipping founder theme '${theme}' due to error:`, error.message);
                    break;
                }
            }
        }
    }

    if (results.length === 0) throw new Error("Failed to generate founders portfolio. Please try again later.");
    return results;
}
