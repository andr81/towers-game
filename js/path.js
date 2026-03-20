// ============================================================
// path.js — Path system: waypoints, interpolation, distance
// ============================================================

class Path {
    constructor(waypoints) {
        this.waypoints = waypoints;
        this.segments = [];
        this.totalLength = 0;
        this._buildSegments();
    }

    _buildSegments() {
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const a = this.waypoints[i];
            const b = this.waypoints[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            this.segments.push({ from: a, to: b, length: len, startDist: this.totalLength });
            this.totalLength += len;
        }
    }

    // Given a distance along the path (0..totalLength), return {x, y, angle}
    getPositionAt(distance) {
        if (distance <= 0) {
            const s = this.segments[0];
            return { x: s.from.x, y: s.from.y, angle: Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x) };
        }
        if (distance >= this.totalLength) {
            const s = this.segments[this.segments.length - 1];
            return { x: s.to.x, y: s.to.y, angle: Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x) };
        }
        for (const seg of this.segments) {
            if (distance <= seg.startDist + seg.length) {
                const t = (distance - seg.startDist) / seg.length;
                return {
                    x: seg.from.x + (seg.to.x - seg.from.x) * t,
                    y: seg.from.y + (seg.to.y - seg.from.y) * t,
                    angle: Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x),
                };
            }
        }
        const s = this.segments[this.segments.length - 1];
        return { x: s.to.x, y: s.to.y, angle: 0 };
    }

    // Check if a distance is past the end
    isFinished(distance) {
        return distance >= this.totalLength;
    }
}
