import { Button } from "@mui/material";
import React from "react";
import { DJANGO_HOST } from "../utils/consts.js";

const CsvButton = ({
  pLDDT,
  lengthRange,
  taxonomy,
  supercog,
  selectedSources,
  x0,
  x1,
  y0,
  y1,
  goTerm,
  ontology
}:{
  pLDDT: number[],
  lengthRange: number[],
  taxonomy: string[],
  supercog: string[],
  selectedSources: string[],
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  goTerm: string,
  ontology: string
}) => {
    const host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
        ? DJANGO_HOST + "/api"
        : window.location.origin + "/api";

    const handleCsvClick = async () => {
        const filters = {
            pLDDT: pLDDT,
            lengthRange: lengthRange,
            taxonomy: taxonomy,
            supercog: supercog,
            selectedSources: selectedSources,
            x0: x0,
            x1: x1,
            y0: y0,
            y1: y1,
            goTerm: goTerm,
            ontology: ontology
        }

        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    if (v !== undefined && v !== null && v !== "")
                    params.append(key, v.toString());
                });
            } else if (value !== undefined && value !== null && value !== "") {
                params.append(key, value.toString());
            }
        }

        const queryString = params.toString();

        const response = await fetch(`${host}/export_to_csv?${queryString}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dane.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            <Button onClick={handleCsvClick}>Csv</Button>
        </div>
    )
}

export default CsvButton;