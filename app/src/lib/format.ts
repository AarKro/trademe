// Swiss display formats, shared by all screens.

/** Average rating with a comma, e.g. 4.8 → «4,8». */
export const formatRating = (avg: number) => avg.toFixed(1).replace('.', ',')
