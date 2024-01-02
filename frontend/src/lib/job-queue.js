export const job_status = {
  waiting: 1,
  running: 2,
  complete: 3,
  failed: 4,
};
export class Job {
  constructor(opts) {
    if (!opts) opts = {};
    this.opts = opts;
    this.id = opts.id;
    this.priority = opts.priority || 5;
    this.job = opts.job;
    this.job_args = opts.args || [];

    this.state = job_status.waiting;
    this.error = null;
    this.result = null;
    this.promise = new Promise((res, rej) => {
      this.p_res = res;
      this.p_rej = rej;
    });
  }

  complete(result) {
    this.state = job_status.complete;
    this.error = null;
    this.result = result;
    this.p_res(result);
  }

  fail(result) {
    this.state = job_status.failed;
    this.error = result;
    this.result = null;
  }
  run() {
    this.state = job_status.running;
    let resolver,rejector,p;
    p = new Promise((res,rej) => { resolver = res; rejector = rej });
    console.log("Running job", this.job_args);
    let res = this.job(...this.job_args);
    if (res.finally) {
      res.then((r) => {
        this.complete(r);
        resolver(r);
      }).catch((err) => {
        this.fail(err);
        rejector(err);
      });
    } else {
      resolver(res);
    }
    return p;
  }
}

export class JobQueue {

  constructor(opts) {
    if (!opts) opts = {};
    this.opts = opts;
    this.runners = 1;
    this.jobs = [];
    this.should_shutdown = false;
    this.run_count = 0;
    this.sleep_time = opts.sleep || 2000;
    this.low_pri_sleep = opts.low_pri_sleep || 10000;
    this.debug_mode = opts.debug || false;
    this.next_job_id = 0;
  }

  shutdown_now() {
    this.should_shutdown = true;
  }
  debug() {
    if (this.debug_mode) {
      console.log(...arguments);
    }
  }
  get_job_id() {
    this.next_job_id += 1;
    return this.next_job_id - 1;
  }
  get_job() {
    let job = this.jobs.splice(0, 1);
    return job ? job[0] : null;
  }
  add_job(fn, opts) {
    if (!opts) opts = {};
    let job = new Job({
      job: fn,
      id: opts.id || this.get_job_id(),
      ...opts,
    });
    this.jobs.push(job);
    return job;
  }
  remove_job(job) {
    for (let i in this.jobs) {
      if (this.jobs[i] == job) {
        this.jobs.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  run(id) {
    if (this.should_shutdown) {
      this.debug("Shutdown received for runner", id); 
      this.run_count -= 1;
      return;
    }
    this.run_count += 1;
    let new_job = this.get_job(), run_p = null;
    if (!new_job) {
      run_p = new Promise((res,rej) => {
        setTimeout(() => res(), this.sleep_time);
      });
    } else {
      this.debug("Runner new job", id, new_job);
      // Priority 0 has an additional delay.
      if (new_job.priority == 0) {
        run_p = new Promise((res,rej) => {
          setTimeout(() => {
            new_job.run().then((r) => { res(r)} ).catch((err) => { rej(err) });
          }, this.low_pri_sleep);
        });
      } else {
        run_p = new_job.run();
      }
    }
    run_p.finally(() => {
      if (new_job) {
        this.debug("Job finished", new_job);
        this.remove_job(new_job);
      }
      this.run(id);
    });
    return run_p;
  }

}
