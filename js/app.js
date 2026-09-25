let dSlider, bSlider, thetaSlider, wSlider, drSlider;
let dVal, bVal, thetaVal, wVal, drVal;
let gammaOut, frOut, cpOut, tOut;

const L = 4.0; // Longitud extendida de la compuerta (Constante)

function setup() {
    // Usamos JavaScript nativo para evitar fallos de dimensiones
    let container = document.getElementById('canvas-container');
    let w = container.clientWidth || 800;
    let h = container.clientHeight || 500;
    
    let canvas = createCanvas(w, h);
    canvas.parent('canvas-container');

    // Conexión segura de los Sliders
    dSlider = document.getElementById('d-slider');
    bSlider = document.getElementById('b-slider');
    thetaSlider = document.getElementById('theta-slider');
    wSlider = document.getElementById('w-slider');
    drSlider = document.getElementById('dr-slider');
    
    // Conexión segura de las etiquetas de los Sliders
    dVal = document.getElementById('d-val');
    bVal = document.getElementById('b-val');
    thetaVal = document.getElementById('theta-val');
    wVal = document.getElementById('w-val');
    drVal = document.getElementById('dr-val');
    
    // Conexión segura de las salidas de resultados
    gammaOut = document.getElementById('gamma-out');
    frOut = document.getElementById('fr-out');
    cpOut = document.getElementById('cp-out');
    tOut = document.getElementById('t-out');
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

    // 1. LECTURA DE VARIABLES
    let D_input = parseFloat(dSlider.value); 
    let b = parseFloat(bSlider.value);
    let theta_deg = parseFloat(thetaSlider.value);
    let W = parseFloat(wSlider.value); 
    let DR = parseFloat(drSlider.value); 

    let theta_rad = radians(theta_deg);

    // 2. FÍSICA: Control de rebose del agua
    // El agua no puede subir más allá de la bisagra superior sin derramarse.
    let max_D = L * sin(theta_rad);
    let D = min(D_input, max_D); // Limitamos la altura al tope de la compuerta

    // Actualizamos los textos de la interfaz
    if (D_input > max_D) {
        dVal.innerText = D.toFixed(2) + " (Rebosando)";
        dVal.style.color = "red";
    } else {
        dVal.innerText = D.toFixed(2);
        dVal.style.color = "#2c3e50";
    }
    bVal.innerText = b.toFixed(2); 
    thetaVal.innerText = theta_deg;
    wVal.innerText = W.toFixed(1); 
    drVal.innerText = DR.toFixed(2);

    // 3. CÁLCULOS FÍSICOS
    let gamma = DR * 9.81; 
    let L_m = D / sin(theta_rad); // Longitud sumergida (desde abajo)
    
    let h_c = D / 2; // Profundidad al centroide del área sumergida
    let F_R = gamma * h_c * (L_m * b); // Fuerza Resultante del fluido
    
    // Centro de presión desde la bisagra SUPERIOR (Origen)
    let s_cp = L - (L_m / 3);
    if (D === 0) s_cp = L;
    
    // Suma de Momentos (Bisagra arriba)
    let M_water = F_R * s_cp; // El agua empuja para ABRIR (hacia arriba)
    let M_weight = W * (L / 2) * cos(theta_rad); // El peso empuja para CERRAR (hacia abajo)
    
    // Tensión (T) en el cable en el extremo libre
    let T_cable = (M_weight - M_water) / L;

    // Actualizar Panel de Resultados
    gammaOut.innerText = gamma.toFixed(2);
    frOut.innerText = F_R.toFixed(2);
    cpOut.innerText = s_cp.toFixed(2);
    tOut.innerText = abs(T_cable).toFixed(2);

    // 4. GRÁFICOS Y VECTORES
    let scaleFactor = min(width, height) / 6.0;
    let originX = width * 0.40;  // Bisagra (Arriba)
    let originY = height * 0.20; 
    let endX = originX + L * cos(theta_rad) * scaleFactor; // Fin de la compuerta (Abajo)
    let endY = originY + L * sin(theta_rad) * scaleFactor;

    let floorY = endY; 
    let leftWallX = width * 0.15;
    let waterY = floorY - D * scaleFactor;
    let interX = endX - L_m * cos(theta_rad) * scaleFactor;

    push();
    
    // Tanque (Pared y suelo)
    stroke(80); strokeWeight(4);
    line(leftWallX, originY - 50, leftWallX, floorY); 
    line(leftWallX, floorY, width * 0.95, floorY); 
    line(originX, originY - 50, originX, originY); 

    // Achurado del tanque
    stroke(130); strokeWeight(2);
    for (let y = originY - 50; y < floorY; y += 20) line(leftWallX, y, leftWallX - 20, y + 20);
    for (let x = leftWallX - 20; x < width * 0.95; x += 20) line(x, floorY, x - 20, floorY + 20);
    for (let y = originY - 50; y < originY - 10; y += 20) line(originX, y, originX + 20, y + 20);

    // Dibujar el Agua
    if (D > 0) {
        fill(52, 152, 219, 140); noStroke();
        beginShape();
        vertex(leftWallX, waterY);
        vertex(interX, waterY);
        vertex(endX, endY);
        vertex(leftWallX, floorY);
        endShape(CLOSE);
        
        stroke(41, 128, 185); strokeWeight(2);
        line(leftWallX, waterY, interX, waterY); // Superficie del agua
    }

    // Compuerta
    stroke(44, 62, 80); strokeWeight(10);
    line(originX, originY, endX, endY);
    
    // Bisagra
    fill(231, 76, 60); noStroke();
    circle(originX, originY, 14); 

    // --- VECTORES DE FUERZA ---

    // 1. Fuerza del Agua (FR)
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY + s_cp * sin(theta_rad) * scaleFactor;
        let sc = constrain(map(F_R, 0, 300, 40, 120), 40, 120);

        let angFR = theta_rad - PI/2; // Perpendicular hacia arriba/derecha
        let fx = cpX - sc * cos(angFR);
        let fy = cpY - sc * sin(angFR);
        
        stroke(231, 76, 60); strokeWeight(3); line(fx, fy, cpX, cpY);
        push(); translate(cpX, cpY); rotate(angFR); fill(231, 76, 60); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("FR", fx - 25, fy + 15, color(231, 76, 60)); 
    }

    // 2. Tensión del Cable (T)
    if (abs(T_cable) > 0.1) {
        let sc = constrain(map(abs(T_cable), 0, 100, 50, 120), 50, 120);
        
        // Dependiendo de si la compuerta tiende a abrirse o cerrarse, el cable tensa hacia un lado u otro
        let angCable = T_cable >= 0 ? theta_rad - PI/2 : theta_rad + PI/2; 
        
        let cableEndX = endX - 150 * cos(angCable);
        let cableEndY = endY - 150 * sin(angCable);
        
        // Dibujo estético del cable
        stroke(120); strokeWeight(2); drawingContext.setLineDash([5, 5]);
        line(endX, endY, cableEndX, cableEndY);
        drawingContext.setLineDash([]); 
        
        // Vector Tensión
        let fx = endX - sc * cos(angCable);
        let fy = endY - sc * sin(angCable);

        stroke(243, 156, 18); strokeWeight(3); line(endX, endY, fx, fy);
        push(); translate(fx, fy); rotate(angCable + PI); fill(243, 156, 18); noStroke(); triangle(0, 0, -12, -6, -12, 6); pop();
        drawLabel("T", fx - 20 * cos(angCable), fy - 20 * sin(angCable), color(243, 156, 18));
    }

    // 3. Peso de la compuerta (W)
    if (W > 0) {
        let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
        let cmY = originY + (L/2) * sin(theta_rad) * scaleFactor;
        
        stroke(39, 174, 96); strokeWeight(3); line(cmX, cmY, cmX, cmY + 50);
        push(); translate(cmX, cmY + 50); rotate(PI/2); fill(39, 174, 96); noStroke(); triangle(0, 0, -10, -5, -10, 5); pop();
        drawLabel("W", cmX + 25, cmY + 25, color(39, 174, 96)); 
    }
    pop();
}

// Escalar si el navegador cambia de tamaño
function windowResized() {
    let container = document.getElementById('canvas-container');
    resizeCanvas(container.clientWidth, container.clientHeight || 500);
}
