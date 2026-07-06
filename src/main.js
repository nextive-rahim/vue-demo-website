import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)

/**
 * v-reveal — fade + rise an element into view on scroll using an
 * IntersectionObserver. Usage: `v-reveal` or `v-reveal="{ delay: 120 }"`.
 * Respects prefers-reduced-motion via the .reveal-init CSS.
 */
app.directive('reveal', {
    mounted(el, binding) {
        el.classList.add('reveal-init')
        if (binding.value?.delay) {
            el.style.transitionDelay = `${binding.value.delay}ms`
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        el.classList.add('reveal-in')
                        observer.unobserve(el)
                    }
                })
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        )
        observer.observe(el)
        el._revealObserver = observer
    },
    unmounted(el) {
        el._revealObserver?.disconnect()
    },
})

app.mount('#app')
