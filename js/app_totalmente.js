// Variables del DOM
let dSlider, bSlider, thetaSlider, wSlider, drSlider;
let dVal, bVal, thetaVal, wVal, drVal;
let gammaOut, frOut, cpOut, faOut;

const L = 2.5; 

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    dSlider = select('#d-slider');
    bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider');
    wSlider = select('#w-slider');
    drSlider = select('#dr-slider'); 

    dVal = select('#d-val');
    bVal = select('#b-val');
    thetaVal = select('#theta-val');
    wVal = select('#w-val');
    drVal = select('#dr-val'); 

    gammaOut = select('#gamma-out');
    frOut = select('#fr-out');
    cpOut = select('#cp-out');
    faOut = select('#fa-out');
}

function drawLabel(txt, x, y, col) {
    push();
    fill(255, 255, 255, 220); 
    noStroke();
    rectMode(CENTER);
    rect(x, y, textWidth(txt) + 12, 24, 4); 
    fill(col);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(BOLD);
    text(txt, x, y); 
    pop();
}

function draw() {
    background(248, 249, 250);

    let D = parseFloat(dSlider.value());
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let W = parseFloat(wSlider.value()); 
    let DR = parseFloat(drSlider.value()); 

    dVal.html(D.toFixed(2));
    bVal.html(b.toFixed(2));
    thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1));
    drVal.html(DR.toFixed(2));

    // CÁLCULOS FÍSICOS (Bisagra superior)
    let gamma = DR * 9.81;
    let theta_rad = radians(theta_deg);
    
    let h_c = D + (L / 2) * sin(theta_rad);
    let F_R = gamma * h_c * (L * b);
    
    let M_water = gamma * b * (D * pow(L, 2) / 2 + sin(theta_rad) * pow(L, 3) / 3);
    let s_cp = F_R > 0 ? M_water / F_R : 0;
    
    let M_weight = W * (L / 2) * cos(theta_rad);
    let F_app = (M_water - M_weight) / L;

    gammaOut.html(gamma.toFixed(2));
    frOut.html(F_R.toFixed(2));
    cpOut.html(s_cp.toFixed(2));
    faOut.html(F_app.toFixed(2));

    // GRÁFICOS
    let scaleFactor = min(width, height) / 7.5;
    let originX = width * 0.45;  // Bisagra arriba
    let originY = height * 0.45; 
    let topWallY = originY - 300;
    let leftWallX = width * 0.15;
    let floorY = height * 0.85;

    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY + L * sin(theta_rad) * scaleFactor;

    push();
    
    // Achurado
    stroke(80); strokeWeight(4);
    line(leftWallX, topWallY, leftWallX, floorY); 
    line(leftWallX, floorY, width * 0.95, floorY); 
    line(originX, topWallY, originX, originY); 
    line(endX, endY, endX, floorY); 

    stroke(130); strokeWeight(2);
    for (let y = topWallY; y < floorY; y += 20) line(leftWallX, y, leftWallX - 20, y + 20);
    for (let x = leftWallX - 20; x < width * 0.95; x += 20) line(x, floorY, x - 20, floorY + 20);
    for (let y = topWallY; y < originY - 10; y += 20) line(originX, y, originX + 20, y + 20);
    for (let y = endY; y < floorY - 10; y += 20) line(endX, y, endX + 20, y + 20);

    // Agua
    let waterY = originY - D * scaleFactor;
    fill(52, 152, 219, 140); noStroke();
    beginShape();
    vertex(leftWallX, waterY);
    vertex(originX, waterY);
    vertex(originX, originY);
    vertex(endX, endY);
    vertex(endX, floorY);
    vertex(leftWallX, floorY);
    endShape(CLOSE);
    
    stroke(41, 128, 185); strokeWeight(2);
    line(leftWallX, waterY, originX, waterY);

    // Compuerta
    let b_offset_x = -b * 8; let b_offset_y = -b * 12;
    fill(180); stroke(100); strokeWeight(1);
    quad(originX, originY, endX, endY, endX + b_offset_x, endY + b_offset_y, originX + b_offset_x, originY + b_offset_y);

    stroke(44, 62, 80); strokeWeight(6);
    line(originX, originY, endX, endY);
    fill(231, 76, 60); noStroke();
    circle(originX, originY, 14);

    // Vectores
    if (abs(F_app) > 0.1) {
        let sc = constrain(map(abs(F_app), 0, 100, 40, 100), 40, 100);
        let angFA = F_app >= 0 ? theta_rad - PI/2 : theta_rad + PI/2; 
        let fx = endX + sc * cos(angFA);
        let fy = endY + sc * sin(angFA);

        stroke(142, 68, 173); strokeWeight(3); line(fx, fy, endX, endY);
        push(); translate(endX, endY); rotate(angFA + PI); fill(142, 68, 173); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("FA", fx + 25, fy - 15, color(142, 68, 173));
    }

    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY + s_cp * sin(theta_rad) * scaleFactor;
        let sc = constrain(map(F_R, 0, 300, 40, 120), 40, 120);

        let angFR = theta_rad - PI/2; 
        let fx = cpX - sc * cos(angFR);
        let fy = cpY - sc * sin(angFR);
        
        stroke(231, 76, 60); strokeWeight(3); line(fx, fy, cpX, cpY);
        push(); translate(cpX, cpY); rotate(angFR); fill(231, 76, 60); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("FR", fx - 25, fy - 20, color(231, 76, 60)); 
    }

    if (W > 0) {
        let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
        let cmY = originY + (L/2) * sin(theta_rad) * scaleFactor;
        
        stroke(39, 174, 96); strokeWeight(3); line(cmX, cmY, cmX, cmY + 60);
        push(); translate(cmX, cmY + 60); rotate(PI/2); fill(39, 174, 96); noStroke(); triangle(0, 0, -10, -5, -10, 5); pop();
        drawLabel("W", cmX + 25, cmY + 35, color(39, 174, 96)); 
    }
    pop();
}

function windowResized() {
    let container = select('#canvas-container');
    resizeCanvas(container.width, container.height);
}
