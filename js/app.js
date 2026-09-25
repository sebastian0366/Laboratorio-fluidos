let dSlider, bSlider, thetaSlider, wSlider, drSlider;
let dVal, bVal, thetaVal, wVal, drVal;
let gammaOut, frOut, cpOut, faOut;

const L = 4.0; // Longitud extendida para soportar h=2.0 a 40° sin sumergirse totalmente

function setup() {
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    dSlider = select('#d-slider'); bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider'); wSlider = select('#w-slider'); drSlider = select('#dr-slider');
    dVal = select('#d-val'); bVal = select('#b-val'); thetaVal = select('#theta-val');
    wVal = select('#w-val'); drVal = select('#dr-val');
    gammaOut = select('#gamma-out'); frOut = select('#fr-out');
    cpOut = select('#cp-out'); faOut = select('#fa-out');
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

    let D = parseFloat(dSlider.value()); // Profundidad medida desde el fondo
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let W = parseFloat(wSlider.value()); 
    let DR = parseFloat(drSlider.value()); 

    dVal.html(D.toFixed(2)); bVal.html(b.toFixed(2)); thetaVal.html(theta_deg);
    wVal.html(W.toFixed(1)); drVal.html(DR.toFixed(2));

    // CÁLCULOS FÍSICOS (Bisagra superior, agua por debajo)
    let gamma = DR * 9.81; 
    let theta_rad = radians(theta_deg);
    
    // Longitud mojada a lo largo de la compuerta
    let L_m = D / sin(theta_rad);
    if (L_m > L) L_m = L; // Limite físico de la compuerta

    let h_c = (L_m * sin(theta_rad)) / 2; // Profundidad al centroide mojado
    let F_R = gamma * h_c * (L_m * b);
    
    // Centro de presión desde la bisagra (arriba)
    let s_cp = L - (L_m / 3);
    if (D === 0) s_cp = L;
    
    // Momentos (El agua empuja hacia arriba/derecha abriendo, el peso hacia abajo cerrando)
    let M_water = F_R * s_cp; 
    let M_weight = W * (L / 2) * cos(theta_rad); 
    
    // Fuerza aplicada en el extremo inferior para mantener el equilibrio
    // Si F_app es positiva, significa que el agua gana y debemos empujar hacia abajo.
    let F_app = (M_water - M_weight) / L;

    gammaOut.html(gamma.toFixed(2));
    frOut.html(F_R.toFixed(2));
    cpOut.html(s_cp.toFixed(2));
    faOut.html(F_app.toFixed(2));

    // GRÁFICOS
    let scaleFactor = min(width, height) / 6.0;
    let originX = width * 0.40;  // Bisagra arriba
    let originY = height * 0.20; 
    let endX = originX + L * cos(theta_rad) * scaleFactor;
    let endY = originY + L * sin(theta_rad) * scaleFactor;

    let floorY = endY; // El fondo del tanque se ajusta a la punta de la compuerta
    let leftWallX = width * 0.15;
    let waterY = floorY - D * scaleFactor;
    let interX = endX - L_m * cos(theta_rad) * scaleFactor;

    push();
    
    // Achurado del tanque
    stroke(80); strokeWeight(4);
    line(leftWallX, originY - 50, leftWallX, floorY); // Pared izq
    line(leftWallX, floorY, width * 0.95, floorY); // Suelo
    line(originX, originY - 50, originX, originY); // Pared vertical de la bisagra

    stroke(130); strokeWeight(2);
    for (let y = originY - 50; y < floorY; y += 20) line(leftWallX, y, leftWallX - 20, y + 20);
    for (let x = leftWallX - 20; x < width * 0.95; x += 20) line(x, floorY, x - 20, floorY + 20);
    for (let y = originY - 50; y < originY - 10; y += 20) line(originX, y, originX + 20, y + 20);

    // Dibuja el Agua (Atrapada debajo de la compuerta)
    if (D > 0) {
        fill(52, 152, 219, 140); noStroke();
        beginShape();
        vertex(leftWallX, waterY);
        vertex(interX, waterY);
        vertex(endX, endY);
        vertex(leftWallX, floorY);
        endShape(CLOSE);
        
        stroke(41, 128, 185); strokeWeight(2);
        line(leftWallX, waterY, interX, waterY); // Superficie libre
    }

    // Compuerta
    stroke(44, 62, 80); strokeWeight(10);
    line(originX, originY, endX, endY);
    fill(231, 76, 60); noStroke();
    circle(originX, originY, 14); // Bisagra

    // VECTORES
    // Fuerza Resultante (El agua empuja perpendicularmente hacia arriba-derecha)
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY + s_cp * sin(theta_rad) * scaleFactor;
        let sc = constrain(map(F_R, 0, 300, 40, 120), 40, 120);

        let angFR = theta_rad - PI/2; // Perpendicular apuntando arriba-derecha
        let fx = cpX - sc * cos(angFR);
        let fy = cpY - sc * sin(angFR);
        
        stroke(231, 76, 60); strokeWeight(3); line(fx, fy, cpX, cpY);
        push(); translate(cpX, cpY); rotate(angFR); fill(231, 76, 60); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("FR", fx - 25, fy + 15, color(231, 76, 60)); 
    }

    // Fuerza Aplicada (En la punta)
    if (abs(F_app) > 0.1) {
        let sc = constrain(map(abs(F_app), 0, 100, 40, 100), 40, 100);
        let angFA = F_app >= 0 ? theta_rad + PI/2 : theta_rad - PI/2; 
        
        let fx = endX - sc * cos(angFA);
        let fy = endY - sc * sin(angFA);

        stroke(142, 68, 173); strokeWeight(3); line(fx, fy, endX, endY);
        push(); translate(endX, endY); rotate(angFA); fill(142, 68, 173); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("FA", fx + 25, fy + 15, color(142, 68, 173));
    }

    // Peso (Hacia abajo)
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
