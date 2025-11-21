
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image`));
        img.src = src;
    });
}

/**
 * Creates a professional portfolio contact sheet from generated images.
 */
export async function createAlbumPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    const canvasWidth = 2480;
    const canvasHeight = 3508;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // 1. Background - Clean Dark Grey
    ctx.fillStyle = '#0b0b16'; 
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Header
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = `bold 100px 'Playfair Display', serif`;
    ctx.fillText('IMAGINOVA STUDIO', 150, 250);

    ctx.fillStyle = '#06b6d4'; // Cyan accent
    ctx.font = `normal 40px 'Inter', sans-serif`;
    ctx.fillText('AI GENERATED COLLECTION', 150, 320);
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(150, 380);
    ctx.lineTo(canvasWidth - 150, 380);
    ctx.stroke();

    // 3. Grid Layout
    const themes = Object.keys(imageData);
    const loadedImages = await Promise.all(Object.values(imageData).map(url => loadImage(url)));
    
    const cols = 2;
    const rows = 3;
    const marginX = 150;
    const marginY = 500;
    const gap = 80;

    const cellWidth = (canvasWidth - (marginX * 2) - (gap * (cols - 1))) / cols;
    const cellHeight = (canvasHeight - marginY - 150 - (gap * (rows - 1))) / rows;

    loadedImages.forEach((img, index) => {
        const theme = themes[index];
        const col = index % cols;
        const row = Math.floor(index / cols);

        const x = marginX + col * (cellWidth + gap);
        const y = marginY + row * (cellHeight + gap);

        // Draw Image Cover Fit
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const cellAspect = cellWidth / cellHeight;
        
        let sX = 0, sY = 0, sW = img.naturalWidth, sH = img.naturalHeight;
        
        if (imgAspect > cellAspect) { // Image is wider
            sW = img.naturalHeight * cellAspect;
            sX = (img.naturalWidth - sW) / 2;
        } else { // Image is taller
            sH = img.naturalWidth / cellAspect;
            sY = (img.naturalHeight - sH) / 2;
        }

        ctx.save();
        // Rounded corners for images
        ctx.beginPath();
        ctx.roundRect(x, y, cellWidth, cellHeight, 40);
        ctx.clip();
        ctx.drawImage(img, sX, sY, sW, sH, x, y, cellWidth, cellHeight);
        ctx.restore();
        
        // Label Overlay
        const labelHeight = 100;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y + cellHeight - labelHeight, cellWidth, labelHeight, [0, 0, 40, 40]);
        ctx.clip();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y + cellHeight - labelHeight, cellWidth, labelHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `500 32px 'Inter', sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(theme.toUpperCase(), x + 40, y + cellHeight - 35);
        ctx.restore();
    });

    return canvas.toDataURL('image/jpeg', 0.95);
}
