const AVAILABILITY_CONFIG = {
  minWorkingHours: 4,
  dayTimeRanges: {
    tuesday: { start: 9, end: 22 },
    wednesday: { start: 9, end: 22 },
    thursday: { start: 9, end: 22 },
    friday: { start: 9, end: 22 },
    saturday: { start: 9, end: 22 },
    sunday: { start: 9, end: 16 }
  },
  timelineSettings: {
    majorTickInterval: 2, // hours
    minorTickInterval: 1, // hours
    handleSize: {
      desktop: 20,
      mobile: 12
    },
    trackHeight: 8,
    startOffset: 1 // offset to start from even hours
  }
};
