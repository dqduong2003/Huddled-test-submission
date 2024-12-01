<script lang="ts">
    import { onMount } from 'svelte';
    import { Chart } from 'chart.js/auto';

    let { events } = $props();
    let selectedArtist = '';
    let artistsList: string[] = []; 

    function convertTimezone(date: string, timezone: string): string {
        const dateObj = new Date(date);
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric", // Extract only the hour
            hourCycle: "h23", // Use 24-hour format
        });
        return formatter.format(dateObj);
    }

    // Group and calculate total engagement
    function groupByHour(events: { artist_name: string; engagement_score: number; created_at: string; timezone: string }[]) {
        const groupedData: Record<string, Record<string, number>> = {};

        events.forEach(({ artist_name, engagement_score, created_at, timezone }) => {
            const hour = convertTimezone(created_at, timezone);
            if (!groupedData[artist_name]) {
                groupedData[artist_name] = {};
            }
            if (!groupedData[artist_name][hour]) {
                groupedData[artist_name][hour] = 0;
            }
            groupedData[artist_name][hour] += engagement_score;
        });

        // Convert to array for easier rendering
        return Object.entries(groupedData).map(([artist_name, hours]) => ({
            artist_name,
            hours: Object.entries(hours).map(([hour, total_score]) => ({
                hour,
                total_score,
            })),
        }));
    }

    let groupedData = groupByHour(events);
    artistsList = groupedData.map(artist => artist.artist_name).sort();

    // Use line chart and update data based on selected artist because it's the best way to visualize hourly data and identify patterns
    // Initialize chart data
    type Dataset = {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        fill: boolean;
        tension: number;
        pointRadius: number;
    };

    let chartData: { labels: string[]; datasets: Dataset[] } = {
        labels: Array.from({ length: 24 }, (_, i) => i.toString()), // Labels for hours 0-23
        datasets: [],
    };

    let chart: Chart;

    function updateChartForSelectedArtist(artistName: string) {
        const artist = groupedData.find((artist) => artist.artist_name === artistName);
        if (!artist) return;

        const data = Array(24).fill(0); // Initialize an array with 24 zeros for each hour of the day
        artist.hours.forEach(({ hour, total_score }) => {
        data[parseInt(hour)] = total_score; 
        });

        chartData.datasets = [{
        label: artist.artist_name,
        data: data,
        borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color for each artist
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        }];

        chart.update();
    }

    onMount(() => {
        const ctx = document.getElementById('engagementChart') as HTMLCanvasElement | null;
        if (!ctx) return;
        chart = new Chart(ctx, {
            type: 'line', // Line chart to visualize hourly data
            data: chartData,
            options: {
            responsive: true,
            scales: {
                x: {
                title: {
                    display: true,
                    text: 'Hour of Day',
                },
                ticks: {
                    stepSize: 1,
                },
                },
                y: {
                title: {
                    display: true,
                    text: 'Engagement Score',
                },
                beginAtZero: true,
                },
            },
            hover: {
                mode: 'index', // Highlights the entire dataset when hovering over a point
                intersect: false, // Allow hovering over the line (not just points)
            },
            interaction: {
                mode: 'index', // Mode for hovering
                intersect: false, // Allow hover even if mouse is not on data point
            },
            elements: {
                line: {
                borderWidth: 3, // Thicker lines for better visibility
                },
            },
            events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        },
    });

    // Set initial chart data for the first artist in the list
    if (artistsList.length > 0) {
        selectedArtist = artistsList[0];
        updateChartForSelectedArtist(selectedArtist);
    }
});

</script>

<!-- Dropdown to select artist -->
<select bind:value={selectedArtist} on:change={() => updateChartForSelectedArtist(selectedArtist)} class="mb-4 p-2 border rounded">
    <option value="">Select Artist</option>
    {#each artistsList as artist}
        <option value={artist}>{artist}</option>
    {/each}
</select>

<div class="chart-container">
    <canvas id="engagementChart"></canvas>
</div>

<div class="overflow-x-auto">
    <div class="min-w-max w-[60rem] h-[60rem] overflow-y-auto relative scrollbar-pretty">
      <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead
          class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0"
        >
          <tr>
            <th scope="col" class="px-6 py-3">Artist Name</th>
            <th scope="col" class="px-6 py-3">Event Type</th>
            <th scope="col" class="px-6 py-3">Engagement Score</th>
            <th scope="col" class="px-6 py-3">Time</th>
          </tr>
        </thead>
        <tbody>
          {#each events as { artist_name, event_type, engagement_score, created_at, timezone }}
            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
              <td
                class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
              >
                {artist_name}
              </td>
              <td class="px-6 py-4">
                {event_type}
              </td>
              <td class="px-6 py-4">
                {engagement_score}
              </td>
              <td class="px-6 py-4">
                {convertTimezone(created_at, timezone)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
</div>
  
<style>
.scrollbar-pretty::-webkit-scrollbar {
    width: 10px;
}

.scrollbar-pretty::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.scrollbar-pretty::-webkit-scrollbar-thumb {
    background: rgba(149, 158, 160, 0.5);
    border-radius: 5px;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.scrollbar-pretty::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 100, 100, 0.7);
}

table {
    width: 100%;
    border-collapse: collapse; 
}

th, td {
    padding: 12px 15px; 
    border: 1px solid #ddd; 
    text-align: left;
}

th {
    background-color: #f4f4f4;
}


tr:nth-child(odd) {
    background-color: #f9f9f9;  
}

tr:nth-child(even) {
    background-color: #e9e9e9;
}

tr:hover {
    background-color: #e0e0e0;
}

.overflow-x-auto {
    max-height: 60rem; 
    overflow-y: auto; 
    overflow-x: auto; 
}

#engagementChart {
    width: 100% !important; 
    height: 800px; 
    margin-bottom: 25px;
  }
</style>