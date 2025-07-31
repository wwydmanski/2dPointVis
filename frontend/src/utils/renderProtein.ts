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

    window.viewer.render(document.getElementById('viewer-dom'), {
        customData: {
        url: `${DJANGO_HOST}/pdb/${pdb_loc}`,
        format: 'pdb',
        },
        bgColor: 'white',
        alphafoldView: true,
    })
}
