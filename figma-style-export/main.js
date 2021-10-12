const request = require('request');

// https://www.figma.com/file/eqGmmYFKbNdGxcM9SQjk2M/px-Design-Kit-(V03.3)-(Thomas)?node-id=2601%3A103569
const secret = {
  'token': '247865-80c69cb4-0a45-478b-8a1d-cb7c6295c3ca',
  'node': '2601:103569'
}

const Color = class Color {
  constructor(data) {
    this.data = data;
    this.name = data.name.replace(/\s+/g, '-').toLowerCase();
    if (data.fills && data.fills[0].type === 'SOLID') {
      this.rgba = {
        r: this.rgbToInt(data.fills[0].color.r),
        g: this.rgbToInt(data.fills[0].color.g),
        b: this.rgbToInt(data.fills[0].color.b),
        a: data.fills[0].opacity
      };
    }
  }
  
  get hex() {
    if (!(this.rgba.r && this.rgba.g && this.rgba.b)) {
      return null;
    }
    return this.rgbToHex(this.rgba.r, this.rgba.g, this.rgba.b);
  }
  
  get cssColor() {
    if (this.rgba && this.rgba.a < 1) {
      return `rgba(${this.hex}, ${this.rgba.a.toFixed(2)})`;
    } else {
      return this.hex;
    }
  }
  
  get cssVariables() {
    return `$${this.name}: ${this.cssColor};`;
  }
  
  rgbToInt(value) {
    return Math.ceil(value * 255);
  }
  
  intToHex(int) {
    let hex = Number(int).toString(16);
    if (hex.length < 2) {
      hex = '0' + hex;
    }
    return hex;
  }
  
  rgbToHex(r, g, b) {
    return '#' + this.intToHex(r) + this.intToHex(g) + this.intToHex(b);
  }
};

const Typography = class Typography {
  constructor(data) {
    this.name = data.name;
    this.breakpoints = [];
    let breakpoints = {};
    
    data.children.forEach(breakpoint => {
      breakpoints[breakpoint.name] = {
        'fontSize': breakpoint.style.fontSize,
        'lineHeight': breakpoint.style.lineHeightPx,
        'color': new Color(breakpoint).cssColor,
        'fontWeight': breakpoint.style.fontWeight,
        'fontFamily': breakpoint.style.fontFamily
      };
    });
    
    this.breakpoints = [breakpoints, ...this.breakpoints];
  }
  
  get cssVariables() {
    let value = JSON.stringify(...this.breakpoints, null, 2);
    
    return `$figma-${this.name}: ${value};\n`;
  }
};

const Button = class Buttons {
  constructor(data) {
    this.name = data.name;
    this.button = [];
    
    let label = data.children[0].children.filter(child => (child.name === 'Button Label'))[0];
    
    this.button = {
      'fontSize': label.style.fontSize,
      'lineHeight': label.style.lineHeightPx,
      'fontWeight': label.style.fontWeight,
      'fontFamily': label.style.fontFamily,
      'borderRadius': data.cornerRadius,
      'borderWidth': data.strokeWeight,
      'paddingLeft': data.paddingLeft - data.strokeWeight,
      'paddingRight': data.paddingRight - data.strokeWeight,
      'paddingTop': data.paddingTop - data.strokeWeight,
      'paddingBottom': data.paddingBottom - data.strokeWeight
    };
  }
  
  get cssVariables() {
    let value = JSON.stringify(this.button, null, 2);
    
    return `$figma-${this.name}: ${value};\n`;
  }
};

for (let index = 0; index < 50; index++) {
  console.log('\n');
}

const start = Date.now();
let options = {
  method: 'GET',
  url: 'https://api.figma.com/v1/files/eqGmmYFKbNdGxcM9SQjk2M/nodes?ids=' + secret.node,
  headers: {
    'X-Figma-Token': secret.token
  }
};

request(options, function(error, response, body) {
  if (error) throw new Error(error);
  const data = JSON.parse(body).nodes[secret.node].document.children;
  
  const colors = data
  .filter(child => (child.name === '#export-colors'))[0].children
  .filter(child => child.type !== 'TEXT');
  const colorObjects = colors.map(color => new Color(color));
  console.log('// Colors:');
  colorObjects.forEach(color => {
    console.log(color.cssVariables);
  }); console.log('\n');
  
  const fonts = data
  .filter(child => child.name === '#export-fonts')[0].children
  .filter(child => child.type === 'FRAME');
  const fontsObjects = fonts.map(typography => new Typography(typography));
  console.log('// Fonts:');
  fontsObjects.forEach(typography => {
    console.log(typography.cssVariables);
  }); console.log('\n');
  
  const buttons = data
  .filter(child => (child.name === '#export-buttons'))[0].children
  .filter(child => child.type === 'INSTANCE');
  const buttonObjects = buttons.map(button => new Button(button));
  console.log('// Buttons:');
  buttonObjects.forEach(button => {
    console.log(button.cssVariables);
  }); console.log('\n');
  
  const end = Date.now();
  const time = ((end - start) / 1000).toFixed(2);
  console.log('Completed in:', time + 's');
});
