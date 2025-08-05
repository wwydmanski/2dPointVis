export const SOURCES = [
  "AFDB light clusters",
  "AFDB dark clusters",
  "ESMAtlas clusters",
  "MIP clusters",
  "MIP singletons"
]

export const SOURCE_MAPPING = {
  "MIP clusters": "MIP clusters",
  "MIP singletons": "MIP singletons",
  "ESMAtlas clusters": "ESMAtlas clusters",
  "AFDB light clusters": "AFDB light clusters",
  "AFDB dark clusters": "AFDB dark clusters"
};

export const ANNOTATION_MAPPING = {
  "general function": "general function",
  "unannotated": "unannotated",
  "superCOG 1": "superCOG 1",
  "superCOG 2": "superCOG 2",
  "superCOG 3": "superCOG 3",
  "superCOG 1+2": "superCOG 1+2",
  "superCOG 1+3": "superCOG 1+3",
  "superCOG 2+3": "superCOG 2+3",
}

export const TAXONOMY_MAPPING = {
  "Bacteria": "Bacteria",
  "Environmental": "Environmental",
  "Plants and Fungi": "Plants and Fungi",
  "Invertebrates": "Invertebrates",
  "Engineered": "Engineered",
  "Host-associated": "Host-associated",
  "Unknown": "Unknown",
  "Vertebrates": "Vertebrates",
  "Mammals": "Mammals",
  "Primates": "Primates",
  "Rodents": "Rodents"
}

export const SearchMode = {
  NAME: 'name',
  GOTERM: 'goterm'
};

export const X_START = 40;

// @ts-ignore
export const DJANGO_HOST = import.meta.env.VITE_DJANGO_HOST;

export const colorMap = {
  "AFDB dark clusters": "#4C5B5C",
  "AFDB light clusters": "#4aa3ff",
  "ESMAtlas clusters": "#2ca02c",
  "MIP clusters": "#d62728",
  "MIP singletons": "#ff9999"
}
