import { Fade, Card, Link, Typography } from "@mui/material";
import React from "react";
import Legend from '../components/Legend.jsx';
import MoreButton from '../components/MoreButton.jsx'

const BottomMenu = () => {
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
          </div>
        </Fade>
    )
}

export default BottomMenu;
