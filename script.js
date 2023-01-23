const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");

//util functions
function drawPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

let keynum;
let keyBytes = new Array(16).fill(0);

function myKeyChange(e, press){

  if(window.event) { // IE                  
    keynum = e.keyCode;
  } else if(e.which){ // Netscape/Firefox/Opera                 
    keynum = e.which;
  }

  if (keynum == 48) { keyBytes[0] = press; }
  if (keynum == 49) { keyBytes[1] = press; }
  if (keynum == 50) { keyBytes[2] = press; }
  if (keynum == 51) { keyBytes[3] = press; }
  if (keynum == 52) { keyBytes[4] = press; }
  if (keynum == 53) { keyBytes[5] = press; }
  if (keynum == 54) { keyBytes[6] = press; }
  if (keynum == 55) { keyBytes[7] = press; }
  if (keynum == 56) { keyBytes[8] = press; }
  if (keynum == 57) { keyBytes[9] = press; }
  if (keynum == 65) { keyBytes[10] = press; }
  if (keynum == 66) { keyBytes[11] = press; }
  if (keynum == 67) { keyBytes[12] = press; }
  if (keynum == 68) { keyBytes[13] = press; }
  if (keynum == 69) { keyBytes[14] = press; }
  if (keynum == 70) { keyBytes[15] = press; }
}

//load the ROM into the memory
//developer.chrome.com/articles/file-system-access/#ask-the-user-to-pick-a-file-to-read
//-------------------------------------------------------------

let fileHandle;
let rom;
let memory = new Array(0x1000008);
let isLoaded = false;

const fs = document.getElementById("file-selector");

fs.addEventListener('click', async () => {

  [fileHandle] = await window.showOpenFilePicker();

  const gameFile = await fileHandle.getFile();
  const contents = await gameFile.arrayBuffer();
  rom = await new Uint8Array(contents);

  memory.fill(0);

  for (let i = 0; i < rom.length; i++) {
    memory[i] = rom[i];
  }

  isLoaded = true;
});

//-------------------------------------------------------------

let pc;
let pixelColorAddress;
let red, green, blue;
let finalColor;

function outerLoop() {
  
  if (isLoaded) {
    //poll the keys and store their states as a 2-byte value at address 0 (big-endian byte ordering)
    memory[0] = keyBytes[15]<<7 | keyBytes[14]<<6 | keyBytes[13]<<5 | keyBytes[12]<<4 | keyBytes[11]<<3 | keyBytes[10]<<2 | keyBytes[9]<<1 | keyBytes[8];
    memory[1] = keyBytes[7]<<7 | keyBytes[6]<<6 | keyBytes[5]<<5 | keyBytes[4]<<4 | keyBytes[3]<<3 | keyBytes[2]<<2 | keyBytes[1]<<1 | keyBytes[0];

    //fetch the 3-byte program counter from address 2
    pc = memory[2]<<16 | memory[3]<<8 | memory[4];

    //INNER LOOP
    for (let i = 0; i < 65536; i++) {
      memory[memory[pc+3]<<16 | memory[pc+4]<<8 | memory[pc+5]] = memory[memory[pc]<<16 | memory[pc+1]<<8 | memory[pc+2]]; //copy 1 byte from A to B

      pc = memory[pc+6]<<16 | memory[pc+7]<<8 | memory[pc+8]; //jump to C
    }

    //send the 64-KiB pixeldata block designated by the byte value at address 5 to the display device
    for (let x = 0; x < 256; x++) {
      for (let y = 0; y < 256; y++) {
        
        pixelColorAddress = memory[5]<<16 | y<<8 | x;

        if (memory[pixelColorAddress] < 216) {

          blue = (memory[pixelColorAddress] % 6)*51;
          green = (Math.floor(memory[pixelColorAddress] / 6) % 6)*51;
          red = (Math.floor(memory[pixelColorAddress] / 36) % 6)*51;

          finalColor = "rgb(" + red + ", " + green + ", " + blue + ")";
        } else {
          finalColor = "#000000";
        }

        drawPixel(x, y, finalColor);
      }
    }

    //todo: send the 256-byte sampledata block designated by the 2-byte value at address 6 to the audio device
  }
}

const frames = 60;
setInterval(outerLoop, 1000/frames);