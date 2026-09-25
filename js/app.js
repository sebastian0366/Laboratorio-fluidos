let dSlider, bSlider, thetaSlider, wSlider, drSlider;
let dVal, bVal, thetaVal, wVal, drVal;
let frOut, cpOut, tOut;

const L = 4.0; // Longitud extendida de la compuerta (Constante)

function setup() {
    let container = document.getElementById('canvas-container');
    let canvas = createCanvas(container.clientWidth, container.clientHeight || 500);
    canvas.parent('canvas-container');

    // Conexión segura por ID
    dSlider = document.getElementById('d-slider');
    bSlider = document.getElementById('b-slider');
    thetaSlider = document.getElementById('theta-slider');
    wSlider = document.getElementById('w-slider');
    drSlider = document.getElementById('dr-slider');
    
    dVal = document.getElementById('d-val');
    bVal = document.getElementById('b-val');
    thetaVal = document.getElementById('theta-val');
    wVal = document.getElementById('w-val');
    drVal = document.getElementById('dr-val');
    
    frOut = document.getElementById('fr-out');
    cpOut = document.getElementById('cp-out');
    tOut = document.getElementById('t-out');
}

function drawLabel(txt, x, y, col) {
    push();
    fill(255, 255, 255, 225); noStroke(); rectMode(CENTER);
    rect(x, y, textWidth(txt) + 12, 24, 4); 
    fill(col); textAlign(CENTER, CENTER); textSize(14); textStyle(BOLD); text(txt, x, y); 
    pop();
}

function draw() {
    background(248, 249, 250);

    let D_input = parseFloat(dSlider.value); 
    let b = parseFloat(bSlider.value);
    let theta_deg = parseFloat(thetaSlider.value);
    let W = parseFloat(wSlider.value); 
    let DR = parseFloat(drSlider.value); 

    let theta_rad = radians(theta_deg);

    // LIMITACIÓN FÍSICA: El agua no puede superar el borde superior de la compuerta
    let max_D = L * sin(theta_rad);
    let D = min(D_input, max_D); 

    if (D_input > max_D) {
        dVal.innerText = D.toFixed(2) + " (Máx)";
        dVal.style.color = "red";
    } else {
        dVal.innerText = D.toFixed(2);
        dVal.style.color = "#2c3e50";
    }
    bVal.innerText = b.toFixed(2); 
    thetaVal.innerText = theta_deg;
    wVal.innerText = W.toFixed(1); 
    drVal.innerText = DR.toFixed(2);

    // --- CÁLCULOS FÍSICOS ---
    let gamma = DR * 9.81; 
    let L_m = D / sin(theta_rad); // Longitud del tramo de compuerta sumergido
    
    let h_c = D / 2; // Profundidad al centroide del área mojada
    let F_R = gamma * h_c * (L_m * b); // Fuerza Resultante del agua
    
    // Centro de presión medido desde la bisagra INFERIOR
    // La distribución de presiones es un triángulo con la máxima presión en la base (bisagra)
    // El centroide de un triángulo está a 1/3 desde su base.
    let s_cp = L_m / 3; 
    
    // Suma de Momentos en la Bisagra Inferior (Equilibrio)
    let M_water = F_R * s_cp; // El agua la empuja para abrirla (Horario)
    let M_weight = W * (L / 2) * cos(theta_rad); // El peso la empuja para abrirla (Horario)
    
    // El cable horizontal la sostiene (Antihorario)
    let T = (M_water + M_weight) / (L * sin(theta_rad));

    // Actualizar Panel
    frOut.innerText = F_R.toFixed(2);
    cpOut.innerText = s_cp.toFixed(2);
    tOut.innerText = T.toFixed(2);

    // --- GRÁFICOS Y POSICIONES ---
    let scaleFactor = min(width, height) / 5.5;
    let floorY = height * 0.85; 
    let originX = width * 0.45; // Bisagra Inferior
    let originY = floorY; 
    
    // Extremo Libre (Parte Superior)
    let endX = originX + L * cos(theta_rad) * scaleFactor; 
    let endY = originY - L * sin(theta_rad) * scaleFactor;

    let leftWallX = width * 0.15; // Pared izquierda del tanque
    let waterY = originY - D * scaleFactor;
    
    // Punto donde la superficie del agua toca la compuerta
    let interX = originX + L_m * cos(theta_rad) * scaleFactor;

    push();
    
    // 1. Tanque y Tierra
    stroke(80); strokeWeight(4);
    line(leftWallX, originY - L * scaleFactor - 40, leftWallX, floorY); // Pared izquierda
    line(leftWallX, floorY, width * 0.9, floorY); // Suelo
    stroke(150); strokeWeight(2);
    for (let x = leftWallX - 20; x < width * 0.9; x += 20) line(x, floorY, x - 20, floorY + 20);
    for (let y = originY - L * scaleFactor - 40; y < floorY; y += 20) line(leftWallX, y, leftWallX - 20, y + 20);

    // 2. Masa de Agua
    if (D > 0) {
        fill(52, 152, 219, 140); noStroke();
        beginShape();
        vertex(leftWallX, waterY);
        vertex(interX, waterY);
        vertex(originX, originY);
        vertex(leftWallX, originY);
        endShape(CLOSE);
        
        // Línea de superficie
        stroke(41, 128, 185); strokeWeight(2);
        line(leftWallX, waterY, interX, waterY);
        
        // Símbolo de superficie libre (triángulo invertido)
        push();
        translate((leftWallX + interX)/2, waterY);
        noFill(); stroke(41, 128, 185);
        triangle(-8, -10, 8, -10, 0, 0);
        line(-12, -10, 12, -10);
        pop();
    }

    // 3. Compuerta
    stroke(44, 62, 80); strokeWeight(10);
    line(originX, originY, endX, endY);
    
    // Bisagra
    fill(231, 76, 60); noStroke();
    circle(originX, originY, 16); 

    // --- VECTORES DINÁMICOS ---
    
    // A. Tensión del Cable (T) - Tira horizontalmente hacia la pared (izquierda)
    if (T > 0.1) {
        stroke(120); strokeWeight(3);
        line(leftWallX, endY, endX, endY); // Dibuja el cable
        
        // Anclaje
        fill(80); noStroke(); rectMode(CENTER);
        rect(leftWallX, endY, 10, 30); 
        
        let sc = constrain(map(T, 0, 100, 50, 150), 50, 150);
        let fx = endX - sc;
        
        stroke(243, 156, 18); strokeWeight(4); line(endX, endY, fx, endY);
        push(); translate(fx, endY); rotate(PI); fill(243, 156, 18); noStroke(); triangle(0, 0, -14, -6, -14, 6); pop();
        drawLabel("T", fx - 25, endY - 25, color(243, 156, 18));
    }

    // B. Fuerza del Agua (FR) - Perpendicular, empujando abajo-derecha
    if (F_R > 0) {
        let cpX = originX + s_cp * cos(theta_rad) * scaleFactor;
        let cpY = originY - s_cp * sin(theta_rad) * scaleFactor;
        let sc = constrain(map(F_R, 0, 300, 50, 120), 50, 120);

        let screenAngle = -theta_rad + PI/2; // 90 grados horario respecto al plano
        let fx = cpX + sc * cos(screenAngle);
        let fy = cpY + sc * sin(screenAngle);
        
        stroke(231, 76, 60); strokeWeight(4); line(cpX, cpY, fx, fy);
        push(); translate(fx, fy); rotate(screenAngle); fill(231, 76, 60); noStroke(); triangle(0, 0, -14, -6, -14, 6); pop();
        drawLabel("FR", fx + 25, fy + 15, color(231, 76, 60)); 
    }

    // C. Peso de la compuerta (W) - Vertical apuntando hacia abajo
    if (W > 0) {
        let cmX = originX + (L/2) * cos(theta_rad) * scaleFactor;
        let cmY = originY - (L/2) * sin(theta_rad) * scaleFactor;
        let sc = constrain(map(W, 0, 40, 40, 100), 40, 100);
        let fx = cmX;
        let fy = cmY + sc;
        
        stroke(39, 174, 96); strokeWeight(4); line(cmX, cmY, fx, fy);
        push(); translate(fx, fy); rotate(PI/2); fill(39, 174, 96); noStroke(); triangle(0, 0, -14, -6, -14, 6); pop();
        drawLabel("W", fx + 25, fy + 15, color(39, 174, 96)); 
    }

    // Dibujo del Ángulo Theta referencial
    push();
    noFill(); stroke(44, 62, 80); strokeWeight(2); drawingContext.setLineDash([4, 4]);
    line(originX, originY, originX + 80, originY);
    drawingContext.setLineDash([]);
    arc(originX, originY, 100, 100, -theta_rad, 0);
    fill(44, 62, 80); noStroke();
    text("θ", originX + 55, originY - 15);
    pop();

    pop();
}

function windowResized() {
    let container = document.getElementById('canvas-container');
    resizeCanvas(container.clientWidth, container.clientHeight || 500);
}
