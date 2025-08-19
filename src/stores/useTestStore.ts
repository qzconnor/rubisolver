import { defineStore } from 'pinia'
import { Color } from 'three'

type State = {
    color: string
}

export const useTestStore = defineStore('test', {
    state: () => ({
        color: "#00ff00",
    } as State),
    actions: {
        setColor(hex: string) {
            this.color = hex
        },
        resetColor() {
            this.color = "#00ff00"
        }
    }
})