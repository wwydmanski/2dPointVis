import { Fade, Card, Link, Typography } from "@mui/material";
import React from "react";
import Legend from '../components/Legend.jsx';
import MoreButton from '../components/MoreButton.jsx'
import CsvButton from "./CsvButton.js";

const BottomMenu = ({
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
  ontology,
  pointIds
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
  ontology: string,
  pointIds: string[]
}) => {
    return (
        <Fade in={true} timeout={1400}>
          <div style={{
            position: "fixed",
            bottom: "20px",
            left: "10px",
            overflow: "hidden",
            borderRadius: "10px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 30
          }}>
            <Card>
              <MoreButton />
            </Card>
            <Card>
              <Legend />
            </Card>
            <Card>
              <CsvButton
                pLDDT={pLDDT}
                lengthRange={lengthRange}
                taxonomy={taxonomy}
                supercog={supercog}
                selectedSources={selectedSources}
                x0={x0}
                x1={x1}
                y0={y0}
                y1={y1}
                goTerm={goTerm}
                ontology={ontology}
                pointIds={pointIds}
              />
            </Card>
          </div>
        </Fade>
    )
}

export default BottomMenu;
