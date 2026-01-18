'use client';

import React from 'react';
import { 
  Box, Paper, Typography, Button, Stack, TextField, 
  MenuItem, Select, FormControl, InputLabel, Grid, 
  IconButton, Badge, Tooltip, Fade, CircularProgress,
  Card, CardMedia, CardActions, Divider, LinearProgress,
  Chip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearIcon from '@mui/icons-material/Clear';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import MovieIcon from '@mui/icons-material/Movie';
import CollectionsIcon from '@mui/icons-material/Collections';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncIcon from '@mui/icons-material/Sync';

const N8N_BASE = '/api/n8n';

const SYNC_PROGRESS_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0YxRjUvOSIvPjxwYXRoIGZpbGw9IiM5NEEzQjgiIGQ9Im05Ni4wNiAxMzcuNjM1LTEuMTEgMi4xcS0uMTkuMzUtLjQyLjV0LS4yMi4xNnEtLjU1LjE2LS4zNSAwLS43NS0uMjYtLjQtLjI1LS45Ny0uNTYtLjU2LS4zMi0xLjMxLS41N3QtLjc1LS4yNi0xLjc3LS4yNnEtLjkyIDAtMS42Mi4yMnQtLjY5LjIzLTEuMTYuNjJ0LS40Ny40LS43Ljk1dC0uMjMgMS4yMXEwIC44NS40NyAxLjQxdDEuMjQuOTVxLjc4LjQgMS43Ny43MXEuOTkuMzIgMi4wMy42N3ExLjA0LjM2IDIuMDMuODN0MS43NiAxLjE4cS43OC43MiAxLjI1IDEuNzZ0LjQ3IDIuNTNxMCAxLjYxLS41NSAzLjAyLS41NiAxLjQxLTEuNjIgMi40NnQtMS4wNyAxLjA1LTIuNiAxLjY1dC0zLjUxLjZxLTEuMTQgMC0yLjI1LS4yMnQtMS4xLS4yMi0yLjEyLS42M3QtMS4wMS0uNDItMS45LS45OXQtLjktLjU4LTEuNTktMS4yOWwxLjMxLTIuMTNxLjE2LS4yMy40Mi0uMzl0LjI3LS4xNS41Ny0uMTVxLjQxIDAgLjg5LjMzdC40Ny4zNCAxLjEzLjc1cS42Ni40MiAxLjU1Ljc2cS44OC4zMyAyLjEyLjMzIDEuOSAwIDIuOTMtLjkwIDEuMDQtLjg5IDEuMDQtMi41OCAwLS45NC0uNDctMS41M3QtLjQ3LS42LTEuMjQtMS4wLS43OC0uNC0xLjc3LS42OXEtLjk5LS4yOC0yLjAxLS42MXQtMi4wMS0uNzktMS43Ny0xLjIwcS0uNzctLjc0LTEuMjQtMS44NnQtLjQ3LTEuMTEtLjQ3LTIuNzUgMC0xLjMwLjUxLTIuNTR0LjUyLTEuMjMgMS41MS0yLjE5dDIuNDUtMS41NHExLjQ1LS41NyAzLjMzLS41NyAyLjExIDAgMy44OS42NnQxLjc5LjY2IDMuMDQgMS44NG0xNS43NiA0LjY5aDMuMjZsLTkuMjIgMjEuNThxLS4xOC40My0uNDcuNjV0LS4yOS4yMy0uODguMjNoLTMuMDRsMy4xNy02LjhsLTYuODUtMTUuNjZoMy41OHEuNDggMCAuNzUuMjN0LjI4LjIzLjQxLjUzbDMuNTkgOC43OHEuMTkuNDQuMzEuODl0LjEyLjQ0LjI0LjkxcS4xNS0uNDcuMzAtLjkycHQuMTQtLjQ1LjMzLS45bDMuNC04Ljc2cS4xMy0uMzMudC40My0uNTR0LjMxLS4yMi42OS0uMjJtOC44Mi43NGwuMjkgMS4zNHEuNTEtLjUxIDEuMDgtLjk1dDEuMi0uNzRxLjY0LS4zMSAxLjM2LS40OHQuNzMtLjE3IDEuNTktLjE3IDEuMzggMCAyLjQ1LjQ3dDEuMDguNDcgMS43OSAxLjMydC43Mi44NSAxLjA5IDIuMDN0LjM3IDIuNnYxMC43N2gtNC4wN3YtMTAuNzdxMC0xLjU2LS43MS0yLjQxdC0yLjE2LS44NXEtMS4wNiAwLTEuOTguNDh0LS45My40OC0xLjc1IDEuMzF2MTIuMjRoLTQuMDh2LTE2LjkzaDIuNXEuNzkgMCAxLjAzLjc0bTI4LjI5IDEuMzYtMS4wOCAxLjQ4cS0uMTguMjN0LS4zNS4zNnEtLjE3LjE0LS41LjE0cS0uMzIgMC0uNjItLjE5dC0uMjktLjE5LS43LS40M3EtLjQyLS4yNC0uOTktLjQzdC0xLjQxLS4xOXEtMS4wNyAwLTEuODguMzl0LS44MS4zOC0xLjM0IDEuMTF0LS41NC43My0uOCAxLjc2cS0uMjcgMS4wMy0uMjcgMi4zMyAwIDEuMzYuMjkgMi40MXQuMjkgMS4wNi44MyAxLjc4dC41NS43MSAxLjMyIDEuMDh0Ljc4LjM4IDEuNzUuMzhxLjk4IDAgMS41OC0uMjR0MS4wMS0uNTNxLjQyLS4yOS43Mi0uNTNxLjMxLS4yNC42OS0uMjRxLjQ5IDAgLjc0LjM4bDEuMTcgMS40OXEtLjY4Ljc5LTEuNDcgMS4zMnQtLjc5LjU0LTEuNjQuODZ0LTEuNzUuNDZxLS45LjEzLTEuNzkuMTMtMS41NyAwLTIuOTUtLjU5dC0xLjM5LS41OC0yLjQzLTEuNzF0LTEuMDQtMS4xMi0xLjY0LTIuNzR0LS42LTEuNjMtLjYtMy43MSAwLTEuODYuNTMtMy40NS41NC0xLjYgMS41OC0yLjc2dDIuNTctMS44MnExLjU0LS42NiAzLjU0LS42NiAxLjg5IDAgMy4zMi42MXQyLjU3IDEuNzVtMTAuODUtMi4xaDQuMDl2MTYuOTNoLTQuMDl6bTQuNjYtNC45M3EwIC41My0uMjIuOTlxLS4yMS40Ni0uNTcuODF0LS4zNS4zNC0uODMuNTV0LTEuMDIuMjFxLS41MyAwLTEtLjIxdC0uODItLjU1cS0uMzUtLjM1LS41NS0uODF0LS4yMS0uOTlxMC0uNTUuMjEtMS4wM3QuMi0uNDcuNTUtLjgydC44Mi0uNTVxLjQ3LS4yMSAxLS4yMXQuNTQgMCAxLjAyLjIxdC40OC4yLjgzLjU1dC4zNi4zNS41Ny44MnQuMjIuNDguMjIgMS4wM203LjEyIDUuNjdsLjI4IDEuMzRxLjUyLS41MSAxLjA4LS45NS41Ny0uNDQgMS4yMS0uNzRxLjYzLS4zMSAxLjM2LS40OHQxLjU4LS4xN3ExLjM5IDAgMi40Ni40N3QxLjA4LjQ3IDEuNzkgMS4zMnQuNzIuODUgMS4wOSAyLjAzdC4zNyAyLjZ2MTAuNzdoLTQuMDd2LTEwLjc3cTAtMS41Ni0uNzEtMi40MXQtMi4xNi0uODVxLTEuMDYgMC0xLjk4LjQ4dC0uOTMuNDgtMS43NSAxLjMxdjEyLjI0aC00LjA4di0xNi45M2gyLjQ5cS44MCAwIDEuMDQuNzRtMjguMTkgNC4zM2gzLjMxcTEuMjIgMCAyLjEzLS4zMXQuOTEtLjMwIDEuNTEtLjg3dC45LTEuMzkuMy0xLjgycTAtLjk2LS4zLTEuNzN0LS4zLS43OC0uODktMS4zMnQtLjYtLjU1LTEuNS0uODR0LS45MS0uMjktMi4xNS0uMjloLTMuMzF6bS00LjQ0LTEyaDcuNzVxMi4zOSAwIDQuMTQuNTZ0Mi44OSAxLjU3IDEuNjkgMi40MXEuNTYgMS40LjU2IDMuMDcgMCAxLjczLS41OCAzLjE3dC0uNTggMS40NS0xLjczIDIuNDl0LTEuMTYgMS4wNC0yLjkgMS42MXQtMS43NC41OC00LjA3LjU4aC0zLjMxdjguNGgtNC40NHptMjMuMzggNy45NWwuMjUgMS45MnEuNzktMS41MiAxLjg4LTIuMzl0MS4wOS0uODYgMi41Ny0uODYgMS4xNyAwIDEuODguNTFsLS4yNiAzLjA1cS0uMDkuMy0uMjQuNDJ0LS4xNi4xMy0uNDIuMTNxLS4yNSAwLS43NC0uMDl0LS40OC0uMDgtLjk1LS4wOHEtLjY3IDAgMS4yLjJ0LS45NS41Ny0uNzQuOS0uNiAxLjJ2MTAuNDNoLTQuMDh2LTE2LjkzaDIuMzlxLjYzIDAgLjg4LjIydC4yNS4yMy4zMy44bTE2LjItMS4yOHExLjg4IDAgMy40Mi42MSAxLjU1LjYxIDIuNjQgMS43M3QxLjEgMS4xMiAxLjcgMi43NHQuNTkgMS42Mi41OSAzLjYxIDAgMi4wMi0uNTkgMy42M3QtLjYgMS42Mi0xLjcgMi43NnQtMS4wOSAxLjE0LTIuNjQgMS43NXQtMS41NC42MS0zLjQyLjYxLTEuOSAwLTMuNDUtLjYxdC0yLjY1LTEuNzV0LTEuMDktMS4xNC0xLjctMi43NnQtLjYtMS42MS0uNi0zLjYzIDAgMS45OXQuNi0zLjYxdC42MS0xLjYyIDEuNy0yLjc0dDEuMS0xLjEyIDIuNjUtMS43M3QzLjQ1LS42MW0wIDE0LjNxMi4xMSAwIDMuMTMtMS40MnQxLjAxLTEuNDIgMS4wMS00LjE1IDAtMi43NC0xLjAxLTQuMTh0LTEuMDItMS40My0zLjEzLTEuNDN0LTIuMTQgMC0zLjE4IDEuNDR0LTEuMDMgMS40NC0xLjAzIDQuMTcgMCAyLjcyIDEuMDMgNC4xNXQxLjA0IDEuNDIgMy4xOCAxLjQybTE3LjY2LTUuOTlxLjc1IDAgMS4zMi0uMnQuNTYtLjIxLjkzLS41N3QuMzctLjM3LjU2LS44OHQuMTktMS4xMnEwLTEuMjUtLjc1LTEuOTl0LS43NS0uNzMtMi4yNS0uNzN0LTEuNTEgMC0yLjI2LjczdC0uNzUuNzQtLjc1IDEuOTkgMCAuNnEuMTkgMS4xMXQuNTYuODguOTQuNThxLjU3LjIgMS4zMi4y bTQuNiA5LjY0cTAtLjUtLjMtLjgxdC0uMjktLjMxLS44MS0uNDlxLS41MS0uMTctMS4xOS0uMjV0LS42OS0uMDgtMS40NS0uMTN0LS43Ny0uMDQtMS41OS0uMDd0LTEuNTktLjEzcS0uNjguMzgtMS4xLjg5dC0uNDIgMS4xOXEwIC40NC4yMi44M3QuMjMuMzkuNzEuNjd0LjQ5LjI4IDEuMjcuNDR0Ljc3LjE1IDEuODkuMTVxMS4xNCAwIDEuOTctLjE3dC44Mi0uMTcgMS4zNi0uNDh0LjUzLS4zMC43OC0uNzN0LjI1LS40Mi4yNS0uOTFtLS44MS0xNy4xMWg0Ljg3djEuNTJxMCAuNzItLjg4Ljg5bC0xLjUxLjI4cS4zNC44Ny4zNCAxLjkxIDAgMS4yNi0uNSAyLjI3dC0uNSAxLjAyLTEuNCAxLjcycS0uODkuNzEtMi4xIDEuMXQtMi42MS4zOXEtLjUgMC0uOTYtLjA1dC0uOTEtLjEzcS0uNzkuNDgtLjc5IDEuMDcgMCAuNTEuNDcuNzV0MS4yNS4zNHQuNzcuMSAxLjc2LjEyLjE5OS4wMyAyLjAzLjExdDIuMDMuMjl0MS43Ny42NXEuNzcuNDUgMS4yNCAxLjIxLjQ3Ljc3LjQ3IDEuOTggMCAxLjEyLS41NSAyLjE3dC0uNTUgMS4wNi0xLjYgMS44OXQtMS4wNS44Mi0yLjU4IDEuMzJ0LTEuNTIuNTEtMy40Ny41MXEtMS45MSAwLTMuMzMtLjM3dC0xLjQyLS4zOC0yLjM2LS45OXQtLjk0LS42Mi0xLjQtMS40M3QtLjQ3LS44MS0uNDctMS42OCAwLTEuMTkuNzItMS45OXQxLjk3LTEuMjhxLS42Ny0uMzUtMS4wNy0uOTN0LS40LS41Ny0uNC0xLjUxIDAtLjM4LjE0LS43OXQuMTUtLjQwLjQyLS44MHQuMjctLjM5LjY4LS43NXQuNDEtLjM1Ljk4LS42My0xLjI5LS43MC0yLjAzLTEuODV0LS43My0xLjE2LS43My0yLjcxIDAtMS4yNS41LTIuMjd0LjUxLTEuMDEgMS40MS0xLjczdDIuMTItMS4xMXExLjIzLS4zOCAyLjY5LS4zOHExLjA4IDAgMi4wNC4yM3QuOTYuMjIgMS43NS42NW0xMS4wNC40NC4yNSAxLjkycS43OS0xLjUyIDEuODgtMi4zOXQxLjA5LS44NiAyLjU3LS44NiAxLjE3IDAgMS44OC41MWwtLjI2IDMuMDVxLS4wOC4zLS4yNC40MnQtLjE2LjEzLS40Mi4xM3EtLjI1IDAtLjc0LS4wOXQtLjQ4LS4wOC0uOTQtLjA4cS0uNjggMCAxLjIxLjJ0LS45NS41Ny0uNzQuOS0uNiAxLjJ2MTAuNDNoLTQuMDh2LTE2LjkzaDIuMzlxLjYzIDAgLjg4LjIydC4yNS4yMy4zMy44bTExLjkzIDUuNTBIMjg3cTAtLjc5LS4yMy0xLjQ5dC0uMjItLjcxLS42Ni0xLjIzdC0uNDUtLjUzLTEuMTMtLjg0dC0uNjktLjMwLTEuNi0uMzB0LTEuNzYgMC0yLjc4IDF0LTEuMDEgMS4wMS0xLjI5IDIuODZtMTAuMzkgMi40NmgtMTAuNDdxLjEwIDEuMzAuNDYgMi4yNXQuOTYgMS41N3EuNTkuNjIgMS40MS45MnQuODEuMzEgMS44MC4zMXQxLjcxLS4yNHQuNzItLjIzIDEuMjUtLjUxdC41NC0uMjguOTQtLjUxdC40MS0uMjMuNzktLjIzcS41MSAwIC43Ni4zOGwxLjE3IDEuNDlxLS42OC43OS0xLjUyIDEuMzJ0LS44NC41NC0xLjc2Ljg2dC0uOTEuMzItMS44Ni40NnQtLjk1LjEzLTEuODQuMTN0LTEuNzcgMC0zLjI4LS41OXQtMS41Mi0uNTgtMi42NC0xLjczdC0xLjEzLTEuMTUtMS43Ny0yLjg0dC0uNjQtMy45MnEwLTEuNzMuNTYtMy4yNnQuNTYtMS41MiAxLjYxLTIuNjV0MS4wNC0xLjEzIDIuNTUtMS43OXQzLjQxLS42NnExLjYwIDAgMi45Ni41MXQxLjM1LjUxIDIuMzIgMS40OXQuOTguOTggMS41MyAyLjQxdC41NSAzLjI2cTAgLjkyLS4yIDEuMjV0LS4yMC4zMi0uNzYuMzJtMTUuMjctNy4xNS0uOTMgMS40N3EtLjE2LjI2LS4zNC4zN3QtLjE5LjExLS40Ny4xMXEtLjI5IDAtLjYzLS4xN2wtLjc5LS4zN3EtLjQ0LS4yMC0xLjAxLS4zN3QtLjU3LS4xNi0xLjM0LS4xNnEtMS4yMSAwLTEuODkuNTF0LS42OS41MS0uNjkgMS4zM3EwIC41NS4zNi45MnQuMzUuMzcuOTQuNjV0LjU4LjI4IDEuMzIuNTF0Ljc1LjIyIDEuNTEuNDh0Ljc3LjI3IDEuNTEuNjB0Ljc1LjM0IDEuMzMuODZ0LjU5LjUyLjk0IDEuMjV0LjM2LjcyLjM2IDEuNzVxMCAxLjIyLS40NCAyLjI1dC0xLjI5IDEuNzh0Ljg2Ljc1LTIuMTMgMS4xN3QtMS4yNi40Mi0yLjkxLjQycS0uODcgMC0xLjcxLS4xNXQtLjgzLS4xNi0xLjYtLjQ0dC0uNzYtLjI4LTEuNDEtLjY2dC0uNjYtLjM4LTEuMTUtLjgzbC45NC0xLjU1cS4xOC0uMjguNDMtLjQzdC4yNS0uMTQuNjMtLjE0dC4zNyAwIC43MS4yMXQuMzQuMjIuNzkuNDZ0LjQ0LjI1IDEuMDQuNDZ0LjYxLjIyIDEuNTMuMjJxLjczIDAgMS4yNS0uMTd0LjUyLS4xOC44NS0uNDZ0LjM0LS4yOC41LS42NXQuMTYtLjc3cTAtLjU5LS4zNi0uOTd0LS4zNS0uMzgtLjk0LS42NnQtLjU4LS4yOC0xLjM0LS41MHQtLjc1LS4yMy0xLjUzLS40OXQtMS41My0uNjJ0LS43Ni0uMzUtMS4zNC0uOTB0LS41OS0uNTQtLjk0LTEuMzN0LS4zNi0uODAtLjM2LTEuOTJxMC0xLjA0LjQyLTEuOTh0LjQxLS45NCAxLjIxLTEuNjR0Mi0xLjEyIDEuMTktLjQyIDIuNzYtLjQycTEuNzUgMCAzLjE4LjU3dDEuNDQgLjU4IDIuNDAgMS41Mm0xNC41IDAtLjkyIDEuNDdxLS4xNy4yNi0uMzUuMzd0LS40Ni4xMXEtLjMwIDAtLjY0LS4xN3QtLjM0LS4xNi0uNzgtLjM3dC0uNDUtLjIwLTEuMDItLjM3dC0uNTctLjE2LTEuMzQtLjE2cS0xLjIxIDAtMS44OS41MXQtLjY5LjUxLS42OSAxLjMzZTAgLjU1LjM2LjkydC4zNS4zNy45NC42NXQxLjMzLjUxcS43NC4yMiAxLjUxLjQ4dC43Ny4yNyAxLjUxLjYwdC43NC4zNCAxLjMzLjg2dC41OC41Mi45NCAxLjI1dC4zNS43Mi4zNSAxLjc1cTAgMS4yMi0uNDQgMi4yNXQtLjQzIDEuMDMtMS4yOSAxLjc4dC0yLjEyIDEuMTctMi45MS40MnEtLjg4IDAtMS43MS0uMTV0LS44My0uMTYtMS42LS40NHQtMS40Mi0uNjZ0LTEuMTUtLjgzbC45NC0xLjU1cS4xOC0uMjguNDMtLjQzdC4yNS0uMTQuNjMtLjE0dC4zNyAwIC43Mi4yMXQuMzMuMjIuNzguNDZ0LjQ1LjI1IDEuMDUuNDZ0LjYwLjIyIDEuNTIuMjJxLjczIDAgMS4yNS0uMTd0LjUyLS4xOC44Ni0uNDZ0LjQ5LS4yOC41LS42NXQuMTYtLjc3cTAtLjU5LS4zNi0uOTd0LS4zNS0uMzgtLjk0LS42NnQtLjU4LS4yOC0xLjMzLS41MHQtLjc1LS4yMy0xLjU0LS40OXQtMS41NC0uNjJ0LS43OC0uMzUtMS4zNC0uOTB0LS41OC0uNTQtLjk0LTEuMzN0LS4zNS0uODAtLjM1LTEuOTJxMC0xLjA0LjQxLTEuOTh0MS4yMS0xLjY0dDIuMTItMS4xMiAyLjc2LS40MnExLjc1IDAgMy4xOS41N3QxLjQzLjU4IDIuMzkgMS41MiIvPjwvc3ZnPg==`;

// Helper to convert Drive links to direct preview URLs
function formatDriveUrl(url: string): string {
    if (!url) return '';
    // Preserve placeholders so they can trigger 'Awaiting Sync' overlay and onError fallback
    if (url.includes('anyoneWithLink')) return 'https://drive.google.com/uc?id=anyoneWithLink&export=download';
    
    // Pattern: /file/d/[ID]/view or /file/d/[ID]/edit
    const fileDMatch = url.match(/\/file\/d\/([^\/?#&]+)/);
    if (fileDMatch && fileDMatch[1]) return `https://drive.google.com/uc?id=${fileDMatch[1]}&export=download`;
    
    // Pattern: ?id=[ID]
    const idMatch = url.match(/[?&]id=([^&?#]+)/);
    if (idMatch && idMatch[1]) return `https://drive.google.com/uc?id=${idMatch[1]}&export=download`;
    
    return url;
}

async function parseJsonSafe(res: Response): Promise<any | null> {
    try {
        const text = await res.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch (e) {
        console.error("[GridLikeMedia] JSON Parse Error:", e);
        return null;
    }
}

export default function GridLikeMedia({ 
  onToast, 
  defaultActivityId, 
  onUpdate, 
  appId: propAppId,
  defaultPhotos,
  defaultVideoDrive,
  defaultVideoExternal
}: { 
  onToast: (m: string) => void; 
  defaultActivityId?: string; 
  onUpdate?: (id: string, media: { photosDriveUrls: string[]; videoDriveUrl: string; videoUrl: string }) => void; 
  appId?: string;
  defaultPhotos?: string;
  defaultVideoDrive?: string;
  defaultVideoExternal?: string;
}) {
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [videoDrive, setVideoDrive] = React.useState<string>('');
  const [videoExternal, setVideoExternal] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploads, setUploads] = React.useState<{ name: string; status: 'pending'|'ok'|'error'; url?: string }[]>([]);
  const [activityId, setActivityId] = React.useState<string>('');
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(new Set());
  const [activities, setActivities] = React.useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [coverUrl, setCoverUrl] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  const [refreshKey, setRefreshKey] = React.useState(0);
  const appId = React.useMemo(() => {
    if (propAppId) return propAppId;
    try { return typeof window !== 'undefined' ? (localStorage.getItem('supplier_application_id') || '') : ''; } catch { return ''; }
  }, [propAppId]);

  React.useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!appId) return; 
      setLoading(true);
      try {
        const params = new URLSearchParams({ applicationId: appId });
        if (activityId) params.set('activityId', activityId);
        const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`, { signal: controller.signal });
        const json = await parseJsonSafe(res);
        if (json?.success) {
          const remoteList: string[] = json.photosDriveUrls || [];
          setPhotos(currentPhotos => {
            const localOnly = currentPhotos.filter(u => u.includes('anyoneWithLink'));
            const finalMerge = Array.from(new Set([...remoteList, ...localOnly]));
            
            if (activityId && onUpdate) {
              onUpdate(activityId, { 
                photosDriveUrls: finalMerge, 
                videoDriveUrl: json.videoDriveUrl || '', 
                videoUrl: json.videoUrl || '' 
              });
            }
            return finalMerge;
          });
          
          if (remoteList.length > 0) setCoverUrl(remoteList[0]);
          setBrokenUrls(new Set()); // Reset broken status
          setVideoDrive(json.videoDriveUrl || '');
          setVideoExternal(json.videoUrl || '');
        }
      } catch {} finally { setLoading(false); }
    };
    load();
    return () => controller.abort();
  }, [appId, activityId, refreshKey]); // Added refreshKey

  React.useEffect(() => {
    if (defaultPhotos !== undefined) {
      const incoming = (defaultPhotos || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      // Only update if actual membership or order changed to prevent loops
      if (incoming.join(',') !== photos.join(',')) {
        setPhotos(incoming);
      }
    }
  }, [defaultPhotos]);

  React.useEffect(() => {
    if (defaultActivityId) setActivityId(defaultActivityId);
  }, [defaultActivityId]);

  // Polling logic for photos if any are placeholders (anyoneWithLink)
  const pollingActive = React.useRef(false);
  const consecutiveEmptyCount = React.useRef(0);
  const hasPlaceholders = photos.some((u: string) => u.includes('anyoneWithLink'));

  React.useEffect(() => {
    // Basic guards
    if (!appId || !activityId || pollingActive.current) return;
    
    // Check if we actually need to start polling
    if (!hasPlaceholders) return;

    // Start polling
    pollingActive.current = true;
    consecutiveEmptyCount.current = 0;
    const controller = new AbortController();
    let retries = 0;
    const maxRetries = 50; // ~5 minutes

    const timer = setInterval(async () => {
      // Don't poll if we are currently saving or uploading new files
      if (saving || uploading) return;

      retries++;
      if (retries > maxRetries) {
        console.warn("[Media Sync] Timeout reached (5m). Stopping poll.");
        clearInterval(timer);
        pollingActive.current = false;
        return;
      }

      try {
        const params = new URLSearchParams({ applicationId: appId, activityId });
        const res = await fetch(`${N8N_BASE}/supplier/media/get?${params.toString()}`, { signal: controller.signal });
        const json = await parseJsonSafe(res);
        
        if (json?.success && Array.isArray(json.photosDriveUrls)) {
          const remoteList: string[] = json.photosDriveUrls;
          const hasRemotePlaceholders = remoteList.some((u: string) => u.includes('anyoneWithLink'));
          
          if (remoteList.length === 0) {
            consecutiveEmptyCount.current++;
            if (consecutiveEmptyCount.current > 20) {
              console.warn("[Media Sync] Backend consistently empty. Stopping.");
              clearInterval(timer);
              pollingActive.current = false;
              return;
            }
          } else {
            consecutiveEmptyCount.current = 0;
          }

          setPhotos(prevPhotos => {
            const hasRemoteFinal = remoteList.length > 0 && !remoteList.some(u => u.includes('anyoneWithLink'));
            
            // If the backend has final images, we should discard all local placeholders
            // because they have been superseded.
            if (hasRemoteFinal) {
              return remoteList;
            }

            const localOnly = prevPhotos.filter(u => u.includes('anyoneWithLink'));
            
            // If the backend returned empty but we have local placeholders, keep the placeholders.
            // This prevents the gallery from "flickering" to empty during the initial sync.
            let nextPhotos = remoteList;
            if (remoteList.length === 0 && localOnly.length > 0) {
              nextPhotos = localOnly;
            } else {
              // Merge: Trust the remote list but keep local placeholders that haven't appeared yet.
              // To avoid duplication, we only add local ones that are uniquely identifiable 
              // (though in this system placeholders are often generic).
              nextPhotos = Array.from(new Set([...remoteList, ...localOnly]));
            }

            if (nextPhotos.join(',') !== prevPhotos.join(',')) {
              if (onUpdate) {
                onUpdate(activityId, { 
                  photosDriveUrls: nextPhotos, 
                  videoDriveUrl: json.videoDriveUrl || '', 
                  videoUrl: json.videoUrl || '' 
                });
              }
              if (nextPhotos.length > 0) setCoverUrl(nextPhotos[0]);
              return nextPhotos;
            }
            return prevPhotos;
          });

          // Only stop polling if the backend returned a non-empty list AND no placeholders remain.
          // This ensures we keep checking if the backend is momentarily empty or still processing stubs.
          if (remoteList.length > 0 && !hasRemotePlaceholders) {
            clearInterval(timer);
            pollingActive.current = false;
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error("[Media Sync] Poll error:", e);
      }
    }, 6000);

    return () => {
      clearInterval(timer);
      controller.abort();
      pollingActive.current = false;
    };
  }, [appId, activityId, onUpdate, saving, uploading, hasPlaceholders]); 

  React.useEffect(() => {
    const loadActivities = async () => {
      if (!appId) return;
      try {
        const res = await fetch(`${N8N_BASE}/supplier/activities/list?applicationId=${encodeURIComponent(appId)}`);
        const json = await parseJsonSafe(res);
        if (json?.success && Array.isArray(json.activities)) {
          setActivities(json.activities.map((a: any, i: number) => ({ id: a.id || `row_${i}`, title: a.title || `Untitled ${i+1}` })));
        }
      } catch {}
    };
    loadActivities();
  }, [appId]);

  const onSave = async (updatedPhotos?: string[]) => {
    if (!appId) { onToast('Missing application ID'); return; }
    setSaving(true);
    try {
      const pList = updatedPhotos !== undefined ? updatedPhotos : photos;
      const mediaData = {
        photosDriveUrls: pList,
        videoDriveUrl: videoDrive.trim(),
        videoUrl: videoExternal.trim()
      };
      const payload = {
        applicationId: appId,
        activityId: activityId,
        ...mediaData
      };
      const res = await fetch(`${N8N_BASE}/supplier/media/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await parseJsonSafe(res);
      if (!json?.success) throw new Error(json?.error || 'Save failed');
      
      // Notify parent immediately
      if (onUpdate && activityId) {
        onUpdate(activityId, mediaData);
      }
      
      onToast('Media updated');
    } catch (e: any) {
      onToast(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!appId) { onToast('Missing application ID'); return; }
    if (!activityId.trim()) { onToast('Select an Activity to attach uploads'); return; }
    const list = Array.from(files);
    setUploads(list.map(f => ({ name: f.name, status: 'pending' })));
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of list) {
        const fd = new FormData();
        fd.append('applicationId', appId);
        if (activityId.trim()) fd.append('activityId', activityId.trim());
        const uniqueName = `${Date.now()}_${f.name.replace(/\s+/g, '_')}`;
        fd.append('file', f, uniqueName);
        const res = await fetch(`${N8N_BASE}/supplier/media/upload`, { method: 'POST', body: fd });
        const json = await parseJsonSafe(res);
          const url = json?.url || json?.driveUrl || '';
        setUploads(u => u.map(x => x.name === f.name ? { ...x, status: url ? 'ok' : 'error', url } : x));
        if (url) uploadedUrls.push(url);
      }
      if (uploadedUrls.length) {
        const next = [...photos, ...uploadedUrls];
        setPhotos(next);
        if (!coverUrl && uploadedUrls.length > 0) setCoverUrl(uploadedUrls[0]);
        onToast('Upload complete');
        await onSave(next);
        setUploads([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (e: any) {
      onToast(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = (url: string) => {
    setCoverUrl(url);
    const reordered = [url, ...photos.filter(u => u !== url)];
    setPhotos(reordered);
    onSave(reordered);
  };

  const handleDelete = (url: string) => {
    const next = photos.filter(u => u !== url);
    setPhotos(next);
    if (coverUrl === url) setCoverUrl(next[0] || '');
    onSave(next);
  };

  // Allow all links to pass, we handle technical placeholders in the UI
  const photoList = React.useMemo(() => photos, [photos]);

  return (
    <Grid container spacing={4}>
      {/* Left: Management */}
      <Grid item xs={12} md={5}>
        <Stack spacing={3}>


          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon fontSize="small" color="primary" /> Media URLs
            </Typography>
            <Stack spacing={2}>
              <TextField 
                label="Photo URLs (Comma-separated)" 
                variant="outlined"
                size="small"
                value={photos.join(', ')} 
                onChange={(e) => setPhotos(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                fullWidth 
                multiline
                rows={2}
                placeholder="Paste Google Drive or Direct Image URLs here"
                sx={{ bgcolor: 'rgba(255,255,255,0.4)' }}
                InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} 
                InputProps={{ style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' } }} 
              />
              <TextField 
                label="Google Drive Video URL" 
                variant="outlined"
                size="small"
                value={videoDrive} 
                onChange={(e) => setVideoDrive(e.target.value)} 
                fullWidth 
                InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} 
                InputProps={{ style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' } }} 
              />
              <TextField 
                label="YouTube / Vimeo URL" 
                variant="outlined"
                size="small"
                value={videoExternal} 
                onChange={(e) => setVideoExternal(e.target.value)} 
                fullWidth 
                InputLabelProps={{ style: { fontFamily: 'Nunito, sans-serif' } }} 
                InputProps={{ style: { fontFamily: 'Nunito, sans-serif', fontSize: '0.85rem' } }} 
              />
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon fontSize="small" color="primary" /> Upload Files
              </Typography>
              <Button 
                  size="small" 
                  onClick={() => {
                      setRefreshKey(s => s + 1);
                  }}
                  startIcon={<SyncIcon />}
                  sx={{ textTransform: 'none', fontFamily: 'Nunito, sans-serif' }}
              >
                  Sync Now
              </Button>
            </Stack>

            <Paper 
              onDragOver={(e)=>{ e.preventDefault(); }} 
              onDrop={(e)=>{ e.preventDefault(); onFilesSelected(e.dataTransfer.files); }}
              sx={{
                p: 3,
                border: '2px dashed #E2E8F0',
                borderRadius: 3,
                bgcolor: '#F8FAFC',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} hidden type="file" accept="image/*,video/*" multiple onChange={(e)=>onFilesSelected(e.target.files)} />
              <CloudUploadIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Drop files or click to browse</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Supports JPG, PNG, MP4</Typography>
            </Paper>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 700 }}>Uploading...</Typography>
                <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
              </Box>
            )}

            {uploads.length > 0 && (
              <Stack spacing={1} sx={{ mt: 2 }}>
                {uploads.map((u, i) => (
                  <Fade in key={i}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                      {u.status === 'pending' ? <CircularProgress size={16} /> : (u.status === 'ok' ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 18 }} /> : <ClearIcon color="error" sx={{ fontSize: 18 }} />)}
                      <Typography variant="caption" sx={{ flex: 1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</Typography>
                    </Box>
                  </Fade>
                ))}
              </Stack>
            )}
          </Box>

          <Button 
            fullWidth
            variant="contained" 
            disabled={saving}
            onClick={() => onSave()}
            sx={{ 
                bgcolor: '#010057', 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(1, 0, 87, 0.15)',
                '&:hover': { bgcolor: '#020080' }
            }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save All Media Changes'}
          </Button>
        </Stack>
      </Grid>

      {/* Right: Gallery */}
      <Grid item xs={12} md={7}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 400, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CollectionsIcon fontSize="small" color="primary" /> Photo Gallery ({photoList.length})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {photoList.some(u => u.includes('anyoneWithLink')) && (
                    <Typography variant="caption" sx={{ color: '#C5A059', fontWeight: 800, fontSize: '0.65rem' }}>SYNCING...</Typography>
                )}
                <Tooltip title="Refresh Gallery">
                    <IconButton size="small" onClick={() => { onSave(); /* Trigger re-load */ }}>
                        <SyncIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
        {photoList.length > 0 && <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>First image is the cover</Typography>}

        {photoList.length === 0 ? (
          <Paper 
            variant="outlined" 
            sx={{ 
                p: 8, borderRadius: 4, textAlign: 'center', bgcolor: 'transparent', borderStyle: 'dashed', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 480 
            }}
          >
             <CollectionsIcon sx={{ fontSize: 64, color: '#E2E8F0', mb: 2 }} />
             <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 600, mb: 1 }}>Your gallery is empty</Typography>
             <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 300 }}>Add URLs or upload photos to see them here.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {photoList.map((url, idx) => {
              const isCover = url === coverUrl || idx === 0;
              return (
                <Grid item xs={6} sm={4} key={url + idx}>
                  <Card sx={{ 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    position: 'relative',
                    border: isCover ? '2px solid #C5A059' : '1px solid #E2E8F0',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)' }
                  }}>
                    <Box sx={{ position: 'relative', height: 120, bgcolor: '#F8FAFC' }}>
                      <CardMedia
                        component="img"
                        height="120"
                        image={formatDriveUrl(url)}
                        alt="Experience photo"
                        sx={{ 
                          objectFit: 'cover',
                          opacity: url.includes('anyoneWithLink') ? 0.4 : 1,
                          filter: url.includes('anyoneWithLink') ? 'blur(2px)' : 'none'
                        }}
                        onError={(e:any) => { 
                          if (!e.target.src.includes('data:image')) {
                            const isPlaceholder = url.includes('anyoneWithLink');
                            if (isPlaceholder) {
                              e.target.src = SYNC_PROGRESS_SVG;
                            } else {
                              // If it's a permanent link that failed, mark it as broken
                              setBrokenUrls((prev: Set<string>) => new Set(prev).add(url));
                            }
                          }
                        }}
                      />
                      {url.includes('anyoneWithLink') && (
                        <Box sx={{ 
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          bgcolor: 'rgba(255,255,255,0.4)', p: 1, textAlign: 'center'
                        }}>
                          <CircularProgress size={20} thickness={6} sx={{ mb: 1, color: '#C5A059' }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#C5A059', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Awaiting Sync
                          </Typography>
                        </Box>
                      )}
                      {!url.includes('anyoneWithLink') && brokenUrls.has(url) && (
                        <Box sx={{ 
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          bgcolor: 'rgba(0,0,0,0.5)', p: 1, textAlign: 'center'
                        }}>
                          <ClearIcon sx={{ mb: 0.5, color: '#fff' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.6rem', textTransform: 'uppercase' }}>
                            Image Broken
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {isCover && (
                      <Chip 
                        label="Cover" 
                        size="small" 
                        icon={<StarIcon sx={{ color: '#fff !important' }} fontSize="small" />}
                        sx={{ 
                          position: 'absolute', top: 8, left: 8, 
                          bgcolor: '#C5A059', color: '#fff', fontWeight: 800,
                          fontSize: '0.65rem'
                        }} 
                      />
                    )}
                    <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'center', gap: 0.5, bgcolor: '#fff' }}>
                        <Tooltip title={isCover ? "Current Cover" : "Set as Cover"}>
                            <IconButton size="small" disabled={isCover} onClick={() => handleSetCover(url)}>
                                {isCover ? <StarIcon fontSize="small" sx={{ color: '#C5A059' }} /> : <StarBorderIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(url)}>
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Box sx={{ mt: 4 }}>
             <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MovieIcon fontSize="small" color="primary" /> Video Preview
            </Typography>
            {(videoDrive || videoExternal) ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#F8FAFC' }}>
                    <Stack spacing={1}>
                        {videoDrive && (
                           <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                             <CheckCircleOutlineIcon color="success" fontSize="small" />
                             <Typography variant="caption" sx={{ fontWeight: 600 }}>Google Drive Video linked</Typography>
                           </Box>
                        )}
                        {videoExternal && (
                           <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                             <CheckCircleOutlineIcon color="success" fontSize="small" />
                             <Typography variant="caption" sx={{ fontWeight: 600 }}>External Video: {videoExternal.substring(0, 40)}...</Typography>
                           </Box>
                        )}
                    </Stack>
                </Paper>
            ) : (
                <Typography variant="caption" sx={{ color: '#94A3B8 italic' }}>No videos linked yet.</Typography>
            )}
        </Box>
      </Grid>
    </Grid>
  );
}

