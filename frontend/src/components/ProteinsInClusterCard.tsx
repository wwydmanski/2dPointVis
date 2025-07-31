import React from "react";
import { Card, Typography, Box, Link } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';

const ProteinsInClusterCard = (
    { data, selectedNonRepresentative, setSelectedNonRepresentative, renderProtein, host }: {
        data: any,
        selectedNonRepresentative: string,
        setSelectedNonRepresentative: (name: string) => void,
        renderProtein: (pdb_loc: string) => void,
        host?: string
    }
) => {
    return (
        <Card sx={{
            overflow: "hidden",
            borderRadius: "10px",
            zIndex: 1,
            padding: "10px",
            width: "50%"
            }}>
            <Typography variant="h6" gutterBottom>
            Proteins in cluster
            </Typography>
            <Box sx={{
            overflowY: "scroll",
            height: "100%"
            }}>
            {data.others.map((protein: any) => {
                console.log("Protein: ", protein);
                return (
                <Box
                    key={protein.name}
                    sx={{
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: 'action.hover'
                    },
                    p: 0.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: selectedNonRepresentative === protein.name ? 'primary.dark' : 'transparent',
                    borderRadius: '4px',
                    color: selectedNonRepresentative === protein.name ? 'white' : 'inherit'
                    }}
                >
                    <Box
                    onClick={() => {
                        setSelectedNonRepresentative(protein.name);

                        fetch(`${host}/pdb_loc/${protein.name}`)
                        .then(res => res.json())
                        .then(pdb_loc => {
                            renderProtein(pdb_loc);
                        });
                    }}
                    >
                    {protein.name}
                    </Box>
                    <Link
                    href={protein.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: any) => e.stopPropagation()}
                    sx={{
                        color: selectedNonRepresentative === protein.name ? 'white' : 'text.secondary',
                        ml: 1,
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    >
                    {/* @ts-ignore */}
                    <LaunchIcon fontSize="small" />
                    </Link>
                </Box>
                )
            })}
            </Box>
        </Card>
    )
}

export default ProteinsInClusterCard;