const hexToRgba = (hex: string, opacity = 1.0) => {
    hex = hex.replace(/^#/, '');

    let r, g, b, a = 1;

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16) / 255;
        g = parseInt(hex[1] + hex[1], 16) / 255;
        b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
        a = parseInt(hex.substring(6, 8), 16) / 255;
    } else {
        console.error('Invalid hex color format:', hex);
        return [0, 0, 0, 1];
    }

    if(opacity) {
        a = opacity;
    }

    return [r, g, b, a];
};

export default hexToRgba;
