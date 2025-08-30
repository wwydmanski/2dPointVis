import { DJANGO_HOST } from "./consts.js";

declare global {
    interface Window {
        viewer?: any;
    }
}

export default function renderProtein(pdb_loc?: string) {
    const viewerDom = document.getElementById('viewer-dom');

    let host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
        ? DJANGO_HOST
        : window.location.origin;
    
    if (!host.endsWith("/api")) {
        host = host.replace(/\/$/, "") + "/api";
    }
    
    const options = {
        customData: {
            url: `${host}/pdb/${pdb_loc}`,
            format: 'pdb',
        },
        bgColor: 'white',
        alphafoldView: true,
    }

    if (!window.viewer) {
        // @ts-ignore
        window.viewer = new PDBeMolstarPlugin();
        window.viewer.render(viewerDom, options);
    } else {
        window.viewer.visual.update(options);
    }
}
