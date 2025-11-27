'use client';

// next
import dynamic from 'next/dynamic';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// third party
import { Props as ChartProps } from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// =========================|| SATISFACTION CHART CARD ||========================= //

export default function SatisfactionChartCard({ chartData }: { chartData: ChartProps }) {
  return (
    <MainCard>
      <Grid container direction="column" spacing={1}>
        <Grid>
          <Typography variant="subtitle1">Customer Satisfaction</Typography>
        </Grid>
        <Grid sx={{ '& .apexcharts-tooltip.apexcharts-theme-light': { color: 'common.white' } }}>
          <Chart {...chartData} />
        </Grid>
      </Grid>
    </MainCard>
  );
}
