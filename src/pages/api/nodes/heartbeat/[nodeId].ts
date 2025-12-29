import type { APIRoute } from 'astro';
import { getScopesCollection, getNodeHeartbeatsCollection, type NodeHeartbeat } from '../../../../lib/db';

/**
 * POST /api/nodes/heartbeat/{nodeId}
 * Receives periodic "I'm alive" pings from telescope nodes
 * 
 * Request body (JSON):
 * {
 *   "ts": "2025-12-29T14:02:31Z",  // Required
 *   "uptime_s": 123456,            // Optional
 *   "load": "0.41 0.32 0.28",      // Optional
 *   "run_index": 7,                // Optional
 *   "total_runs": 20,              // Optional
 *   "last_capture": "H1_2025-12-29T14-01-55Z.raw"  // Optional
 * }
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { nodeId } = params;

    if (!nodeId) {
      return new Response(JSON.stringify({ error: 'Node ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required field
    if (!body.ts || typeof body.ts !== 'string') {
      return new Response(JSON.stringify({ error: 'Field "ts" is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Look up scope by nodeId (matching the name field, case-insensitive)
    const scopes = await getScopesCollection();
    const scope = await scopes.findOne({ 
      name: { $regex: new RegExp(`^${nodeId}$`, 'i') } 
    });

    if (!scope) {
      return new Response(JSON.stringify({ error: 'Scope not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const receivedAt = new Date();

    // Store heartbeat in node_heartbeats collection
    const heartbeats = await getNodeHeartbeatsCollection();
    const heartbeat: NodeHeartbeat = {
      nodeId,
      receivedAt,
      ts: body.ts,
      uptime_s: body.uptime_s,
      load: body.load,
      run_index: body.run_index,
      total_runs: body.total_runs,
      last_capture: body.last_capture,
    };

    await heartbeats.insertOne(heartbeat);

    // Update cached status on scope record
    const updateFields: any = {
      lastHeartbeatAt: receivedAt,
      lastSeenClientTs: body.ts,
      updatedAt: receivedAt,
    };

    if (body.run_index !== undefined) {
      updateFields.lastRunIndex = body.run_index;
    }
    if (body.total_runs !== undefined) {
      updateFields.totalRuns = body.total_runs;
    }
    if (body.last_capture !== undefined) {
      updateFields.lastCapture = body.last_capture;
    }

    await scopes.updateOne(
      { _id: scope._id },
      { $set: updateFields }
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process heartbeat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

