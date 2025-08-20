import { DJANGO_HOST } from "./consts.js";

declare global {
    interface Window {
        viewer?: any;
    }
}

export default function renderProtein(pdb_loc: string) {
    if (window.viewer === undefined) {
        // @ts-ignore
        const viewerInstance = new PDBeMolstarPlugin();
        window.viewer = viewerInstance;
    }

    // Ensure DJANGO_HOST is a valid string and append /api if missing
    let host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
        ? DJANGO_HOST
        : window.location.origin;
    if (!host.endsWith("/api")) {
        host = host.replace(/\/$/, "") + "/api";
    }

    window.viewer.render(document.getElementById('viewer-dom'), {
        customData: {
            url: `${host}/pdb/${pdb_loc}`,
            format: 'pdb',
        },
        bgColor: 'white',
        alphafoldView: true,
    })
}
