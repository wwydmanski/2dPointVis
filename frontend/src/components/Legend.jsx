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