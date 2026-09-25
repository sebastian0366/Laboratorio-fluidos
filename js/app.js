let dSlider, bSlider, thetaSlider, wSlider, drSlider;
let dVal, bVal, thetaVal, wVal, drVal;
let gammaOut, frOut, cpOut, tOut;

const L = 4.0; // Longitud extendida

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    dSlider = select('#d-slider'); bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider'); wSlider = select('#w-slider'); drSlider = select('#dr-slider');
    dVal = select('#d-val'); bVal = select('#b-val'); thetaVal = select('#theta-val');
    wVal = select('#w-val'); drVal = select('#dr-val');
    
    gammaOut = select('#gamma-out'); frOut = select('#fr-out');
    cpOut = select('#cp-out'); tOut = select('#t-out'); // Ahora es Tensión (T)
}

function drawLabel(txt, x, y, col) {
    push();
    fill(255, 255, 255, 220); noStroke(); rectMode(CENTER);
    rect(x, y, textWidth(txt) + 12, 24, 4); 
    fill(col); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD); text(txt, x, y); 
    pop();
}

function draw() {
    background(248, 249, 250);

    let D = parseFloat(dSlider.value()); 
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let W = parseFloat(wSlider.value()); 
    let DR = parseFloat(drSlider.value()); 

    dVal.html(D.toFixed(2)); bVal.html(b.toFixed(2)); thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1)); drVal.html(DR.toFixed(2));

    // CÁLCULOS FÍSICOS (Bisagra superior, agua por debajo)
    let gamma = DR * 9.81; 
    let theta_rad = radians(theta_deg);
    
    let L_m = D / sin(theta_rad);
    if (L_m > L) L_m = L; 

    let h_c = (L_m * sin(theta_rad)) / 2; 
    let F_R = gamma * h_c * (L_m * b);
    
    // Centro de presión desde la bisagra (arriba)
    let s_cp = L - (L_m / 3);
    if (D === 0) s_cp = L;
    
    // Momentos (El agua empuja abriendo, el peso empuja cerrando)
    let M_water = F_R * s_cp; 
    let M_weight = W * (L / 2) * cos(theta_rad); 
    
    // Tensión (T) en el cable. 
    // T > 0 significa que el cable jala hacia arriba (peso domina)
    // T < 0 significa que el cable jala hacia abajo (agua domina)
    let T_cable = (M_weight - M_water) / L;

    gammaOut.html(gamma.toFixed(2));
    frOut.html(F_R.toFixed(2));
    cpOut.html(s_cp.toFixed(2));
    tOut.html(abs(T_cable).toFixed(2)); // Mostramos magnitud

    // GRÁFICOS
    let scaleFactor = min(width, height) / 6.0;
    let originX = width * 0.40;  
    let originY = height * 0.20; 
    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY + L * sin(theta_rad) * scaleFactor;

    let floorY = endY; 
    let leftWallX = width * 0.15;
    let waterY = floorY - D * scaleFactor;
    let interX = endX - L_m * cos(theta_rad) * scaleFactor;

    push();
    
    // Achurado del tanque
    stroke(80); strokeWeight(4);
    line(leftWallX, originY - 50, leftWallX, floorY); 
    line(leftWallX, floorY, width * 0.95, floorY); 
    line(originX, originY - 50, originX, originY); 

    stroke(130); strokeWeight(2);
    for (let y = originY - 50; y < floorY; y += 20) line(leftWallX, y, leftWallX - 20, y + 20);
    for (let x = leftWallX - 20; x < width * 0.95; x += 20) line(x, floorY, x - 20, floorY + 20);
    for (let y = originY - 50; y < originY - 10; y += 20) line(originX, y, originX + 20, y + 20);

    // Dibuja el Agua
    if (D > 0) {
        fill(52, 152, 219, 140); noStroke();
        beginShape();
        vertex(leftWallX, waterY);
        vertex(interX, waterY);
        vertex(endX, endY);
        vertex(leftWallX, floorY);
        endShape(CLOSE);
        
        stroke(41, 128, 185); strokeWeight(2);
        line(leftWallX, waterY, interX, waterY); 
    }

    // Compuerta
    stroke(44, 62, 80); strokeWeight(10);
    line(originX, originY, endX, endY);
    fill(231, 76, 60); noStroke();
    circle(originX, originY, 14); 

    // VECTORES
    // Fuerza Resultante (Agua)
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY + s_cp * sin(theta_rad) * scaleFactor;
        let sc = constrain(map(F_R, 0, 300, 40, 120), 40, 120);

        let angFR = theta_rad - PI/2; 
        let fx = cpX - sc * cos(angFR);
        let fy = cpY - sc * sin(angFR);
        
        stroke(231, 76, 60); strokeWeight(3); line(fx, fy, cpX, cpY);
        push(); translate(cpX, cpY); rotate(angFR); fill(231, 76, 60); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("FR", fx - 25, fy + 15, color(231, 76, 60)); 
    }

    // Tensión (Cable)
    if (abs(T_cable) > 0.1) {
        let sc = constrain(map(abs(T_cable), 0, 100, 50, 120), 50, 120);
        // Dibuja el cable (línea punteada o gris)
        let angCable = T_cable >= 0 ? theta_rad - PI/2 : theta_rad + PI/2; 
        let cableEndX = endX - 150 * cos(angCable);
        let cableEndY = endY - 150 * sin(angCable);
        
        stroke(150); strokeWeight(2); drawingContext.setLineDash([5, 5]);
        line(endX, endY, cableEndX, cableEndY);
        drawingContext.setLineDash([]); // Reset
        
        // Vector Tensión
        let fx = endX - sc * cos(angCable);
        let fy = endY - sc * sin(angCable);

        stroke(243, 156, 18); strokeWeight(3); line(endX, endY, fx, fy);
        push(); translate(fx, fy); rotate(angCable + PI); fill(243, 156, 18); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("T", fx - 20 * cos(angCable), fy - 20 * sin(angCable), color(243, 156, 18));
    }

    // Peso
    if (W > 0) {
        let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
        let cmY = originY + (L/2) * sin(theta_rad) * scaleFactor;
        
        stroke(39, 174, 96); strokeWeight(3); line(cmX, cmY, cmX, cmY + 50);
        push(); translate(cmX, cmY + 50); rotate(PI/2); fill(39, 174, 96); noStroke(); triangle(0, 0, -10, -5, -10, 5); pop();
        drawLabel("W", cmX + 25, cmY + 25, color(39, 174, 96)); 
    }
    pop();
}

function windowResized() {
    let container = select('#canvas-container');
    resizeCanvas(container.width, container.height);
}
