export class MetricsClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async send(metric) {
    try {
      await fetch(`${this.endpoint}/metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metric),
      });
    } catch (err) {
      console.error("Metrics send failed:", err);
    }
  }

  increment(name, labels = {}) {
    return this.send({
      name,
      value: 1,
      labels,
      timestamp: Date.now(),
    });
  }

  observe(name, value, labels = {}) {
    return this.send({
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }
}