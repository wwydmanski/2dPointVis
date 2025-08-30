import { DJANGO_HOST } from "./consts.js";

declare global {
    interface Window {
        viewer?: any;
    }
}

export default function renderProtein(pdb_loc: string) {
    let host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
        ? DJANGO_HOST
        : window.location.origin;
    if (!host.endsWith("/api")) {
        host = host.replace(/\/$/, "") + "/api";
    }

    if (!window.viewer) {
        // @ts-ignore
        window.viewer = new PDBeMolstarPlugin();
        window.viewer.render(document.getElementById('viewer-dom'), {
            customData: {
                url: `${host}/pdb/${pdb_loc}`,
                format: 'pdb',
            },
            bgColor: 'white',
            alphafoldView: true,
        });
    } else {
        window.viewer.load({
            customData: {
                url: `${host}/pdb/${pdb_loc}`,
                format: 'pdb',
            },
            alphafoldView: true,
        });
    }
}
