const fs = require('fs');
const path = 'src/components/ui/calendar.tsx';
let file = fs.readFileSync(path, 'utf8');

file = file.replace(/\[--cell-size:--spacing\(7\)\]/g, "");
file = file.replace(/\[--cell-radius:var\(--radius-md\)\]/g, "");
file = file.replace(/size-\(--cell-size\)/g, "h-9 w-9");
file = file.replace(/w-\(--cell-size\)/g, "w-9");
file = file.replace(/h-\(--cell-size\)/g, "h-9");
file = file.replace(/px-\(--cell-size\)/g, "px-9");
file = file.replace(/min-w-\(--cell-size\)/g, "min-w-9");
file = file.replace(/rounded-\(--cell-radius\)/g, "rounded-md");
file = file.replace(/rounded-l-\(--cell-radius\)/g, "rounded-l-md");
file = file.replace(/rounded-r-\(--cell-radius\)/g, "rounded-r-md");
file = file.replace(/size-auto/g, "");
file = file.replace(/h-full w-full/g, "h-9 w-9");
file = file.replace(/flex-1 rounded-\(--cell-radius\)/g, "w-9 text-center rounded-md");
// For the weekday fix if it wasn't caught by the above:
file = file.replace(/"flex-1 rounded-md/g, '"w-9 text-center rounded-md');

fs.writeFileSync(path, file);
console.log('Calendar styles patched!');
