---
hl-publish: true
---

The **wave equation** is a second-order linear [[partial differential equation]] in space and time that describes linear [[Dispersion|nondispersive]] [[wave]] phenomena. In one spatial dimension $x$, it reads
$$\frac{ \partial ^{2} \psi(x,t) }{ \partial x^{2} }=\frac{1}{v^{2}}\frac{ \partial ^{2}\psi (x,t) }{ \partial t^{2} } \tag{1}$$
$\psi(x,t)$ is the [[scalar field]] solution to the equation and it is called the **wavefunction**, whereas the parameter $v$ is interpreted in physics as the **speed of the wave** (although the concept of wave speed is more complicated; here $v$ is both the [[phase velocity]] and the [[group velocity]]). The value of $\psi$ for any $x$ and $t$ is called the **[[amplitude]]** of the wave in that place and time[^1]. In multiple spatial dimensions $\mathbf{r}$, the equation generalizes using the [[Laplacian]]:
$$\nabla ^{2}\psi(\mathbf{r},t)=\frac{1}{v^{2}}\frac{ \partial ^{2} \psi(\mathbf{r},t) }{ \partial t^{2} } \tag{2}$$
It can also be written in an extremely terse manner using the [[d'Alembertian]] operator:
$$\square ^{2} \psi(\mathbf{r},t)=0$$
This form in particular makes it easy to see that, in a way, the wave equation is actually nothing more than a generalized [[Laplace's equation]]. In fact, just like how Laplace's equation is generalized to [[Poisson's equation]], the wave equation can itself be generalized to
$$\square ^{2}\psi(\mathbf{r},t)=f$$
for some real-valued function $f$. This is known as the **inhomogeneous** wave equation, as opposed to the **homogeneous** wave equation when $f=0$.

The wave equation and many equations derived from it find numerous applications in physics, such as in the study of [[electromagnetic wave|electromagnetic waves]] in electrodynamics and the study of [[Funzione d'onda|wavefunctions]] of the [[Equazione di Schrödinger|Schrödinger equation]] in quantum mechanics.

As mentioned above, the wave equation cannot describe *every* wave. It specifically only works for linear waves in nondispersive media, such as the vacuum. It can describe waves made up of an arbitrary number of [[Frequency|frequencies]]; there is no need for the wave to be monochromatic. However, it cannot describe nonlinear waves, nor can it model the effects of dispersion. It also cannot describe anisotropic or inhomogeneous media. Since these effects appear very commonly in the real world, numerous generalizations of the wave equation exist to explain them, such as the aforementioned Schrödinger equation, which is a nonlinear wave equation.
## Introduction to waves
Wavefunctions are complicated objects and there are a myriad variations in their behavior in different conditions. This makes them exceptionally useful, as they can model an incredible range of phenomena across many different branches of science, but it also makes them somewhat daunting to approach at first.

Say for simplicity we remain in one dimension, where $\psi(x,t)$ is our wave function. The "shape" of the wave is given by the function evaluated at a specific time. That gets rid of the time dependency and returns the amplitude of the wave over space; "amplitude over all space" is really what we're saying when we talk about shape. In the simplest possible configuration, the wave "holds its shape" as it travels in space. Such a wave is said to be **nondispersive**, and the converse is pretty intuitively said to be **[[dispersion|dispersive]]**. In pleasant nondispersive situations[^2], the shape is found quite easily by evaluating at $t=0$ (or any time really): $\psi(x,0)=f(x)$. We call $f(x)$ the **profile** of the wave. The motion of the wave itself is then just shifting $f(x)$ to the left and right at some known speed.

Given the profile and the claim of nondispersion, we can construct the general form of the wavefunction by hand. After all, since the shape doesn't change (no [[scaling]]) and we are in one dimension (no [[Rotation|rotations]]), the only geometric operation we can do is a translation, that is, moving the entire thing left or right. Since $v$ is our speed, the shift after some time $t$ is just what you'd expect it to be, $x'=x\pm vt$. Then, our wavefunction must be:
$$\boxed{\psi(x,t)=\psi(x\pm vt,0)=f(x\pm vt)}\tag{3}$$
This is the essence of a nondispersive waves. If you're mathematically inclined, they are a specific subset of functions that are dependent on both time and space, and *specifically* as $x\pm vt$. As such, they are univariate functions (at least for 1D waves). This is how you distinguish a generic function of time and space from a nondispersive wave. In practice, they are functions of a *single* variable $x\pm vt$.

As is often the case in geometry, the signs can be confusing: $-$ is for a wave moving *forward* (towards positive $x$) and $+$ is for a wave moving *backwards* (towards negative $x$). This is just a byproduct of algebra, don't think too much of it. Conveniently, we have proper names for these cases: waves moving forward $\psi(x,t)=f(x-vt)$ are said to be **progressive waves**, whereas those moving backwards $\psi(x,t)=f(x+vt)$ are said to be **regressive waves**. More generally, these are known as **[[traveling wave|traveling waves]]**. You can imagine one by taking a rope and tugging it up and down: your impulse will travel down the rope to the other side.

Of course, we constructed our solution somewhat arbitrarily here. We have no proof that it is a *valid* solution of $(1)$. Thankfully, the proof is easy:
$$\frac{ \partial ^{2}\psi }{ \partial x^{2} } =\frac{ \partial ^{2}f }{ \partial x^{2} } =f'',\qquad \frac{ \partial ^{2}\psi }{ \partial t^{2} } =\frac{ \partial  }{ \partial t } \left( \frac{ \partial f }{ \partial t }  \right)=\frac{ \partial  }{ \partial t } (\pm vf')=v^{2}f''$$
so
$$\frac{ \partial ^{2}\psi }{ \partial x^{2} } =\frac{1}{v^{2}}\frac{ \partial ^{2}\psi }{ \partial t^{2} }\quad\Rightarrow \quad f'' =\frac{1}{v^{2}}v^{2}f''\quad\Rightarrow \quad f''=f''$$
which is true for any twice-[[Differential|differentiable]] function of $x\pm vt$.

It is of course true for both progressive and regressive waves. But notice how the wave equation is linear: different possible solutions of such an equation can be [[Linear combination|linearly combined]] and the combination is itself a solution. Thus, the *general* solution to the one-dimensional wave equation must be
$$\boxed{\psi(x,t)=\alpha f(x-vt)+\beta g(x+vt)}$$
for some functions $f$ and $g$ and some constants $\alpha$ and $\beta$. This form allows us to identify one last kind of wave that we did not mention before: if the progressive and regressive waves combine in such a way that their sum moves neither left nor right, we get a wave that doesn't travel. We call this a **[[standing wave]]**. An example would be a guitar string pulled from the center: it just vibrates up and down but doesn't go anywhere.
### Boundary conditions
So far, we've talked about waves in general. We haven't mentioned *where* they are, leaving that detail to the imagination. We should now however ask ourselves this question: *where* is the wave? More importantly, how does it interact when interacting with other objects, such as the knot at the end of a rope? The answers lie in the **boundary conditions** of the wave, the mathematical statement of how the wavefunction behaves at the "edges".

Consider some wave. We'll use a [[Plane wave|sine wave]] in complex notation, since that's the easiest waveform to handle[^3]:
$$\psi_{I}(x,t)=\tilde{A}_{I}e^{i(k_{1}x-\omega t)}\quad\text{for }x<0$$
where $\tilde{A}_{I}$ is a complex number. The [[Frequency|angular frequency]] $\omega$ is constant. You can imagine this as a rope being shaken up and down. For example let's say this rope is attached at one end to another rope, at $x=0$. Let's also say this second rope is denser (higher mass-per-unit-length) so that it is distinguishable from the first. On the left end, the wave starts at $x=-\infty$. This way, we get a wave coming from some place that travels until it collides with another object. We call this an **incident wave**. It is easiest to visualize as a **[[wave packet]]**, a short, localized, traveling impulse.

:::image
![[Wave_packet_propagation.gif|400]]
An example of wave packet. Don't worry too much about the packet also changing shape as it travels (but see [[Group velocity]] if you're curious about why).
By Becarlson - Own work, CC BY-SA 4.0, from [Wikipedia](https://commons.wikimedia.org/w/index.php?curid=67433782).
:::

When the wave from the first rope hits the knot at $x=0$, some of the impulse from the first must of course be transferred to the second. What happens here is twofold: on one hand, the second rope *does* start oscillating, inheriting some of the [[energy]] of the first rope and oscillating at an *identical* frequency $\omega$. This new wave is called a **transmitted wave** and in our case, it is also a sine wave:
$$\psi_{T}(x,t)=\tilde{A}_{T}e^{i(k_{2}x-\omega t)}\quad\text{for }x>0$$
Note the different [[wavenumber]] $k_{2}\neq k_{1}$ due to the different mass density. On the other hand, part of the original wave is *reflected back*, bouncing off the knot and going back to where it started. This is called the **reflected wave**, and is again a sine wave
$$\psi_{R}(x,t)=\tilde{A}_{R}e^{i(-k_{1}x-\omega t)}\quad\text{for }x<0$$
Note the $-k_{1}x$ to represent the fact that it is going backwards. Thus, at any given time at any point in space, the wave is well-described by the sum of these:
$$\psi(x,t)=\begin{cases}
\tilde{A}_{I}e^{i(k_{1}x-\omega t)}+\tilde{A}_{R}e^{i(-k_{1}x-\omega t)}&\text{for }x<0 \\
\tilde{A}_{T}e^{i(k_{2}-\omega t)}&\text{for }x>0
\end{cases}$$
Now that we have a suitable wave function, we can talk about its boundary conditions. One of them is obvious: the ropes must be connected! That is to say that $\psi(x,t)$ must be continuous in $x=0$, otherwise the ropes wouldn't even be connected. In fact, sometimes we can even say more: if the knot has negligible mass, the two ropes are basically just one long rope with a jump in mass density about $x=0$, which implies that the $x$ [[partial derivative]] of $\psi(x,t)$ is also continuous in $x=0$. These are our two boundary conditions:
$$\psi(0^{-},t)=\psi(0^{+},t),\qquad \frac{ \partial \psi }{ \partial x } (0^{-},t)=\frac{ \partial \psi }{ \partial x } (0^{+},t)$$
If you plug $\psi$ in these and do the math you get
$$\tilde{A}_{I}+\tilde{A}_{R}=\tilde{A}_{T},\qquad k_{1}(\tilde{A}_{I}+\tilde{A}_{R})=k_{2}\tilde{A}_{T}$$
We have three unknown in two equations: that means we can at best hope to express to unknowns in terms of the third. Since presumably we can control the amplitude of the incident wave, we'll write $\tilde{A}_{R}$ and $\tilde{A}_{T}$ in terms of $\tilde{A}_{I}$:
$$\tilde{A}_{R}=\left( \frac{k_{1}-k_{2}}{k_{1}+k_{2}} \right)\tilde{A}_{I},\qquad \tilde{A}_{T}=\left( \frac{2k_{1}}{k_{1}+k_{2}} \right)\tilde{A}_{I}$$
If you prefer, since we're working with nondispersive sine waves, you can use the dispersion relations $\omega=v_{1}k_{1}=v_{2}k_{2}$ to rewrite these in terms of the velocities:
$$\tilde{A}_{R}=\left( \frac{v_{2}-v_{1}}{v_{2}+v_{1}} \right)\tilde{A}_{I},\qquad \tilde{A}_{T}=\left( \frac{2v_{2}}{v_{2}+v_{1}} \right)\tilde{A}_{I}$$
Now, we want to go back to the real world, which is to say that we want to the real amplitudes $A_{I}$, $A_{R}$ and $A_{T}$. They are given by
$$A_{R}e^{i\delta _{R}}=\left( \frac{v_{2}-v_{1}}{v_{2}+v_{1}} \right)A_{I}e^{i\delta_{I}},\qquad A_{T}e^{i\delta_{T}}=\left( \frac{2v_{2}}{v_{2}+v_{1}} \right)A_{I}e^{i\delta_{I}}$$
where $\delta_{I}$, $\delta_{R}$ and $\delta_{T}$ are the respective [[phase]] constants of the waves. If the second wave is faster ($v_{2}>v_{1}$), then all three waves must be in phase to satisfy the equations: $\delta_{I}=\delta_{R}=\delta_{T}$. Otherwise, if $v_{2}<v_{1}$, they are out of phase. Specifically, the reflected wave has reversed phase: $\delta_{I}=\delta_{R}+\pi=\delta_{T}$ (since $\pi=180°$ is half a cycle).

One last thing to note is that the second rope doesn't budge ($v_{2}=0$ so $v_{2}<v_{1}$), then
$$A_{R}=A_{I},\qquad A_{T}=0$$
This makes sense: you can't transmit a wave to something that can't move. In fact, this is what would happen if instead of having an ideal infinite-mass rope, we just knotted the rope to a wall or other unmoving object.

[^1]: This is assuming $\psi$ is a real-valued function. It if is complex-valued, then both the complex $\psi$ and its square modulo $\lvert \psi \rvert^{2}$ can be interpreted as amplitudes in some way. For quantum-mechanical [[Funzione d'onda|wavefunctions]], for example, $\psi$ is the [[probability amplitude]] and $\lvert \psi \rvert^{2}$ is the [[Probability]] itself.

[^2]: We don't really get to choose: nondispersive waves are the only ones that the wave equation can describe. Dispersive waves need more complicated forms of the wave equation.

[^3]: Boundary conditions are for the real part of the wave, since that's, well, the "real" wave. However, since the imaginary part of a complex sine wave is just the real sine wave [[phase]]-shifted from sine to cosine, the boundary conditions don't change. The complex sine wave inherits all the same conditions as the real sine wave.
