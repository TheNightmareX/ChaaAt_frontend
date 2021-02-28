import { Vue, Component } from "vue-property-decorator";

@Component
export class TickMixin extends Vue {
  tick = false;
  ticker!: number;

  created() {
    this.ticker = setInterval(() => (this.tick = !this.tick), 1000);
  }

  destroyed() {
    clearInterval(this.ticker);
  }
}
