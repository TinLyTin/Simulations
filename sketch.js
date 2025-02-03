// Global parameters
let particles = [];
const numParticles = 25;
const cylinderRadius = 200;  // Radius of the inner cylindrical container
const cylinderHeight = 400;  // Height of the cylinder (centered at 0)
const particleRadius = 5;    // Radius of each particle

// Outer spherical container encloses the cylinder.
// If your environment doesn't support the exponentiation operator ( ** ),
// use Math.pow instead, like this:
// const outerSphereRadius = Math.sqrt(cylinderRadius * cylinderRadius + Math.pow(cylinderHeight/2, 2)) + 20;
const outerSphereRadius = Math.sqrt(cylinderRadius * cylinderRadius + (cylinderHeight/2) ** 2) + 20;

// Scene transformation parameters
const rotationSpeed = 0.005;      // Speed of container rotation
const zoomAmplitude = 0.3;        // Amplitude of zoom oscillation
const zoomSpeed = 0.005;          // Speed of zoom oscillation
const baseZoom = 1.0;             // Base zoom factor

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  // Set the rectangle mode so the overlay covers the full canvas (used for trails)
  rectMode(CORNER);
  // Set an initial background
  background(0);
  
  // Create particles with random positions and velocities within the cylinder
  for (let i = 0; i < numParticles; i++) {
    let pos = randomPointInCylinder(cylinderRadius - particleRadius, cylinderHeight);
    let vel = p5.Vector.random3D();
    vel.mult(random(1, 3));
    // Use bright random colors for each particle
    let col = color(random(100, 255), random(100, 255), random(100, 255));
    particles.push(new Particle(pos, vel, col));
  }
}

function draw() {
  // --- Trail Effect ---
  // Instead of clearing the canvas completely, draw a translucent black rectangle
  // to create a fading trail.
  push();
    resetMatrix();
    noStroke();
    fill(0, 20); // Low alpha for gradual fading
    rect(-width/2, -height/2, width, height);
  pop();
  
  // --- Scene Transformations ---
  let t = frameCount;
  // Calculate a zoom factor that oscillates over time.
  let zoomFactor = baseZoom + zoomAmplitude * sin(t * zoomSpeed);
  
  push();
    // Apply the zoom effect and slow rotations for a dynamic view.
    scale(zoomFactor);
    rotateY(t * rotationSpeed);
    rotateX(t * rotationSpeed * 0.5);
  
    // --- Draw the External Spherical Container ---
    push();
      noFill();
      stroke(255, 150);
      strokeWeight(1);
      sphere(outerSphereRadius);
    pop();
  
    // --- Draw the Inner Cylindrical Container ---
    push();
      noFill();
      stroke(255, 200);
      strokeWeight(2);
      // p5.js's cylinder() draws a cylinder centered at the origin along the Y-axis.
      cylinder(cylinderRadius, cylinderHeight);
    pop();
  
    // --- Update and Display Each Particle ---
    for (let p of particles) {
      p.update();
      p.display();
    }
  
  pop();
}

// Returns a random point inside a cylinder with radius r and height h.
// Ensures the particle (of given particleRadius) starts fully within the container.
function randomPointInCylinder(r, h) {
  let angle = random(TWO_PI);
  let rad = sqrt(random()) * r; // Uniform distribution over circle
  let x = rad * cos(angle);
  let z = rad * sin(angle);
  let y = random(-h/2 + particleRadius, h/2 - particleRadius);
  return createVector(x, y, z);
}

// Particle class definition
class Particle {
  constructor(position, velocity, col) {
    this.position = position;
    this.velocity = velocity;
    this.col = col;
    this.radius = particleRadius;
  }
  
  update() {
    // Move the particle by its velocity.
    this.position.add(this.velocity);
    
    // --- Collision Detection with the Cylindrical Walls (Side) ---
    let horizDist = sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
    if (horizDist > cylinderRadius - this.radius) {
      // Compute a horizontal normal vector pointing outward.
      let normal = createVector(this.position.x, 0, this.position.z);
      normal.normalize();
      // Check if the particle is moving outward; if so, reflect its velocity.
      let dot = this.velocity.dot(normal);
      if (dot > 0) {
         this.velocity.sub(p5.Vector.mult(normal, 2 * dot));
      }
      // Correct the particle's position to lie exactly at the boundary.
      normal.mult(cylinderRadius - this.radius);
      this.position.x = normal.x;
      this.position.z = normal.z;
    }
    
    // --- Collision Detection with the Top and Bottom Faces ---
    if (this.position.y > cylinderHeight/2 - this.radius) {
       this.position.y = cylinderHeight/2 - this.radius;
       this.velocity.y *= -1;
    }
    if (this.position.y < -cylinderHeight/2 + this.radius) {
       this.position.y = -cylinderHeight/2 + this.radius;
       this.velocity.y *= -1;
    }
  }
  
  display() {
    push();
      translate(this.position.x, this.position.y, this.position.z);
      noStroke();
      fill(this.col);
      sphere(this.radius);
    pop();
  }
}

// Adjust the canvas size if the browser window is resized.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
