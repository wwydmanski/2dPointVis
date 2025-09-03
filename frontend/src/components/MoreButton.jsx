import { Button, MenuItem, Link, Typography, Modal, Box } from "@mui/material";
import Menu from '@mui/material/Menu';
import React from "react";
import LaunchIcon from '@mui/icons-material/Launch';

const MoreButton = () => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [showModal, setShowModal] = React.useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const modalBoxStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    
    return (
        <div>
            {showModal ? 
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalBoxStyle}>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Have feedback or found a problem? <br/>We’d love to hear from you at: p.szczerbiak@sanoscience.org
                    </Typography>
                </Box>
            </Modal> : null}
            <Button onClick={handleClick}>
                More
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem
                    onClick={() => {
                        setShowModal(true)
                        handleClose()
                    }} 
                >
                    <Typography style={{ marginRight: "8px", fontSize: 20 }}>@</Typography>
                    <Typography 
                        variant="body2" 
                        fontWeight="medium"
                    >
                        Feedback
                    </Typography>
                </MenuItem>
                <MenuItem>
                    <Link
                        href="https://www.nature.com/articles/s41467-025-63250-3"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClose}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            color: "text.primary"
                        }}
                    >
                        <LaunchIcon fontSize="small"  style={{ marginRight: "8px" }} />
                        <Typography variant="body2" fontWeight="medium">Publication</Typography>
                    </Link>
                </MenuItem>
                <MenuItem>
                    <Link
                        href="https://github.com/Tomasz-Lab/protein-structure-landscape"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleClose}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                            color: "text.primary"
                        }}
                    >
                        <svg height="20" width="20" viewBox="0 0 16 16" style={{ marginRight: "8px" }}>
                        <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                        <Typography variant="body2" fontWeight="medium">GitHub Repository</Typography>
                    </Link>
                </MenuItem>
            </Menu>
        </div>
    )
}

export default MoreButton;