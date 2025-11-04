# Data Generator - Technical Reference

This tool generates realistic fleet tracking data for the assessment using real road routes.

## Quick Usage

```bash
cd data-generator
npm install
npm run generate
```

Your data will be created in: `assessment-YYYY-MM-DD-HH-MM-SS/`

## Generated Files

You'll get 5 trip data files:
- `trip_1_cross_country.json` - Long haul delivery
- `trip_2_urban_dense.json` - Urban delivery route  
- `trip_3_mountain_cancelled.json` - Cancelled trip
- `trip_4_southern_technical.json` - Trip with technical issues
- `trip_5_regional_logistics.json` - Regional logistics trip
- `fleet-tracking-event-types.md` - Event type reference


## Troubleshooting

**If generation fails:**
- Wait a few minutes and try again (API rate limits)
- Check your internet connection
- Use fallback data in `assessment-fallback-data/` folder

**If you get Node.js errors:**
- Update to Node.js v18+ from [nodejs.org](https://nodejs.org)

**Expected generation time:** 2-5 minutes
