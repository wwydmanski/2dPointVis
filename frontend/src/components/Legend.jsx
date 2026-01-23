import React from "react";
import { colorMap } from '../utils/consts';
import { MenuItem } from "@mui/material";
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';

const Legend = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <Button 
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                Legend
            </Button>
            <Menu 
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <div style={{display: 'flex', justifyContent: 'center', width: "100%"}}>
                    <div style={{width: 180, fontSize: 12}}>
                        Each dot in the visualization is a non-redundant cluster after second-stage Foldseek clustering. Dot color indicates the representative protein's database/type from the first-stage Foldseek clustering (see Fig. 1 in the paper: section MORE). By default, the visualization samples 10,000 points at startup. Whenever the user changes the viewpoint, the view is updated by adding 1,000 more points to improve detail.
                    </div>
                </div>
                {Object.keys(colorMap).map((name, index) => 
                    <MenuItem key={index+name} onClick={handleClose}>
                        <div style={{display: 'flex', justifyContent: 'space-between', width: "100%"}}>
                            <span>{name}</span>
                            <span style={{
                                backgroundColor: colorMap[name],
                                width: 20,
                                height: 20,
                                marginLeft: 10,
                                borderRadius: 4
                            }}/>
                        </div>
                    </MenuItem>
                )}
            </Menu>
        </div>

    )
}

export default Legend;