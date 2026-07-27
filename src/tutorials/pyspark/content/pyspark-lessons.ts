export type SceneKey =
  | "sparkArch"
  | "driverExecutor"
  | "dagStages"
  | "partitions"
  | "shuffle"
  | "cache"
  | "parallelTasks"
  | "cluster"
  | "pipeline";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "code"; code: string; caption?: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; tone: "tip" | "warn" | "note"; text: string };

export type Lesson = {
  id: string;
  title: string;
  tagline: string;
  blocks: Block[];
  scene?: SceneKey;
  takeaways: string[];
};

export type Module = {
  id: string;
  title: string;
  color: string;
  lessons: Lesson[];
};

const L = (l: Lesson): Lesson => l;

export const modules: Module[] = [
  {
    id: "foundations",
    title: "1 · Foundations",
    color: "var(--java-orange)",
    lessons: [
      L({
        id: "what-is-spark",
        title: "What is PySpark?",
        tagline: "The Python API for Apache Spark — distributed compute for data that doesn't fit on one machine.",
        scene: "sparkArch",
        blocks: [
          { kind: "p", text: "PySpark is the Python interface to Apache Spark, an open-source engine for large-scale data processing. You write Python code, but the actual work runs in parallel across a cluster of machines managed by Spark's JVM engine." },
          { kind: "p", text: "A Spark application has three roles: a Driver that runs your script and plans the work, a Cluster Manager that hands out resources, and Executors — worker processes on each node that run tasks and hold data partitions in memory." },
          { kind: "code", caption: "The pipeline in one line", code: "your_script.py → PySpark Driver → Cluster Manager → Executors → your data" },
          { kind: "callout", tone: "tip", text: "Rotate the 3D scene below to see the Driver, Cluster Manager and Executors as separate stages that tasks flow through." },
        ],
        takeaways: [
          "PySpark = Python API on top of the Spark JVM engine (via Py4J).",
          "Driver plans, Executors run, Cluster Manager coordinates.",
          "Same code scales from a laptop to thousands of nodes.",
        ],
      }),
      L({
        id: "install-and-session",
        title: "Installing PySpark & the SparkSession",
        tagline: "Your first program — and every piece of the setup explained.",
        blocks: [
          { kind: "p", text: "Install PySpark with pip, then create a SparkSession — the single entry point to every Spark feature (DataFrames, SQL, streaming, ML)." },
          { kind: "code", caption: "shell", code: "pip install pyspark" },
          { kind: "code", code: `from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
        .appName("HelloSpark")
        .master("local[*]")    # use all local cores
        .getOrCreate()
)

print(spark.version)
spark.range(5).show()` },
          { kind: "list", items: [
            "appName — label your app shows in the Spark UI.",
            "master — local[*] for laptop, or yarn / k8s:// / spark://host in a cluster.",
            "getOrCreate — reuse an existing session if one already exists.",
            "spark.range(5) — smallest DataFrame you can build, useful for demos.",
          ] },
          { kind: "callout", tone: "note", text: "In notebooks like Databricks or Colab, a SparkSession named 'spark' is usually pre-created for you." },
        ],
        takeaways: [
          "SparkSession is the single entry point to DataFrames, SQL, streaming and ML.",
          "'local[*]' runs Spark in one JVM using every CPU core.",
          "Always call getOrCreate() so you don't build two sessions by accident.",
        ],
      }),
      L({
        id: "rdd-vs-dataframe",
        title: "RDD vs DataFrame vs Dataset",
        tagline: "Three APIs, one engine — and why DataFrames are almost always the right choice.",
        scene: "driverExecutor",
        blocks: [
          { kind: "p", text: "Spark started with RDDs (Resilient Distributed Datasets): immutable collections of Python objects split across the cluster. RDDs give total control but no schema and no automatic optimization." },
          { kind: "p", text: "DataFrames added a schema on top — rows and named, typed columns, like a distributed table. Spark's Catalyst optimizer can then rewrite your query for you." },
          { kind: "code", code: `# RDD — low level, arbitrary Python objects
rdd = spark.sparkContext.parallelize([("Ada", 36), ("Grace", 85)])
rdd.map(lambda t: (t[0].upper(), t[1] + 1)).collect()

# DataFrame — schema, SQL, Catalyst optimizer
df = spark.createDataFrame(
    [("Ada", 36), ("Grace", 85)],
    schema=["name", "age"],
)
df.selectExpr("upper(name) AS name", "age + 1 AS age").show()` },
          { kind: "callout", tone: "tip", text: "Rule of thumb: reach for DataFrames first. Drop to RDDs only when you truly need per-row Python control that the DataFrame API can't express." },
        ],
        takeaways: [
          "RDD = distributed collection of Python objects, no schema.",
          "DataFrame = distributed table with a schema; optimized by Catalyst.",
          "Dataset is JVM-only (Scala/Java) — Python users get DataFrames.",
        ],
      }),
      L({
        id: "lazy-evaluation",
        title: "Transformations & Actions",
        tagline: "Why nothing runs until you ask for a result — and why that's a feature.",
        blocks: [
          { kind: "p", text: "Every Spark operation is either a transformation (returns a new DataFrame, does no work yet) or an action (triggers computation and returns a value to the Driver)." },
          { kind: "code", code: `df = spark.read.parquet("/data/orders")

# Transformations — LAZY, build a plan
filtered = df.filter(df.amount > 100)
by_country = filtered.groupBy("country").sum("amount")

# Action — triggers execution
by_country.show()          # runs the plan
by_country.count()         # runs it AGAIN unless cached` },
          { kind: "list", items: [
            "Transformations: select, filter, groupBy, join, withColumn, agg…",
            "Actions: show, count, collect, take, write, foreach.",
            "Spark inspects the whole plan before running — it can push filters down and prune columns.",
          ] },
          { kind: "callout", tone: "warn", text: "Every action re-runs the plan from scratch. Cache or write intermediate results if you'll use them more than once." },
        ],
        takeaways: [
          "Transformations are lazy — they only build the plan.",
          "Actions trigger execution and pull a result back to the Driver.",
          "Lazy evaluation is what lets Catalyst optimize the whole query.",
        ],
      }),
    ],
  },
  {
    id: "dataframes",
    title: "2 · DataFrames",
    color: "var(--java-blue)",
    lessons: [
      L({
        id: "creating-dataframes",
        title: "Creating DataFrames",
        tagline: "From lists, dicts, pandas, CSV, JSON, Parquet — every common source.",
        scene: "partitions",
        blocks: [
          { kind: "code", code: `from pyspark.sql import Row

# From a Python list of tuples with an explicit schema
df1 = spark.createDataFrame(
    [(1, "Ada"), (2, "Grace"), (3, "Linus")],
    schema="id INT, name STRING",
)

# From a list of Row objects
df2 = spark.createDataFrame([Row(id=1, name="Ada")])

# From files
df_csv     = spark.read.option("header", True).csv("/data/*.csv")
df_json    = spark.read.json("/data/events.json")
df_parquet = spark.read.parquet("/data/orders")` },
          { kind: "callout", tone: "tip", text: "Prefer Parquet for storage — it's columnar, compressed, and preserves schema, so Spark can read only the columns it needs." },
        ],
        takeaways: [
          "createDataFrame turns Python data into a distributed DataFrame.",
          "spark.read.<format> covers CSV, JSON, Parquet, ORC, Avro, JDBC, Delta…",
          "Parquet is the default choice for analytical workloads.",
        ],
      }),
      L({
        id: "schemas-and-types",
        title: "Schemas & Types",
        tagline: "Inferred vs explicit schemas, and why explicit almost always wins.",
        blocks: [
          { kind: "code", code: `from pyspark.sql.types import (
    StructType, StructField, IntegerType, StringType, DoubleType, TimestampType,
)

schema = StructType([
    StructField("id",        IntegerType(),   nullable=False),
    StructField("name",      StringType(),    nullable=True),
    StructField("amount",    DoubleType(),    nullable=True),
    StructField("created_at", TimestampType(), nullable=True),
])

df = spark.read.schema(schema).csv("/data/orders.csv", header=True)
df.printSchema()` },
          { kind: "list", items: [
            "Inferring the schema scans the file — slow and sometimes wrong.",
            "An explicit schema is faster and rejects bad rows early.",
            "Common types: IntegerType, LongType, DoubleType, StringType, BooleanType, TimestampType, DateType, ArrayType, MapType, StructType.",
          ] },
        ],
        takeaways: [
          "Explicit schemas skip a full-file scan and guarantee stable types.",
          "StructType composes nested structs; ArrayType and MapType handle collections.",
        ],
      }),
      L({
        id: "select-filter-withcolumn",
        title: "select, filter & withColumn",
        tagline: "The three verbs you'll use in every single script.",
        scene: "pipeline",
        blocks: [
          { kind: "code", code: `from pyspark.sql import functions as F

(df
    .select("id", "name", (F.col("amount") * 1.2).alias("gross"))
    .filter((F.col("country") == "FR") & (F.col("amount") > 100))
    .withColumn("year", F.year("created_at"))
    .withColumnRenamed("name", "customer")
    .drop("id")
    .show()
)` },
          { kind: "list", items: [
            "select — pick / compute a subset of columns.",
            "filter (alias: where) — keep matching rows.",
            "withColumn — add or replace a single column.",
            "F.col('x') vs df.x — same thing; F.col works with any DataFrame.",
          ] },
          { kind: "callout", tone: "tip", text: "Chain everything through pyspark.sql.functions (imported as F). Never use Python if/else on Column objects — use F.when(...).otherwise(...) instead." },
        ],
        takeaways: [
          "select / filter / withColumn cover the vast majority of transforms.",
          "Column expressions are lazy — no data moves until an action fires.",
          "Use F.when / F.coalesce / F.lit for conditional and constant columns.",
        ],
      }),
      L({
        id: "groupby-aggregations",
        title: "groupBy & Aggregations",
        tagline: "Compute sums, counts and stats across billions of rows.",
        scene: "shuffle",
        blocks: [
          { kind: "code", code: `from pyspark.sql import functions as F

(df
    .groupBy("country", "product")
    .agg(
        F.count("*").alias("orders"),
        F.sum("amount").alias("revenue"),
        F.avg("amount").alias("avg_ticket"),
        F.countDistinct("customer_id").alias("customers"),
    )
    .orderBy(F.col("revenue").desc())
    .show(20)
)` },
          { kind: "callout", tone: "warn", text: "groupBy always triggers a shuffle — data with the same key must land on the same executor. The 3D scene shows how rows are bucketed by hashed key." },
        ],
        takeaways: [
          "agg() takes multiple aggregations at once — always prefer it to chained groupBy calls.",
          "countDistinct is expensive; approx_count_distinct is often good enough and 10-100× faster.",
          "Every groupBy causes a shuffle across the network.",
        ],
      }),
      L({
        id: "joins",
        title: "Joins",
        tagline: "Inner, left, right, full, semi, anti — plus the join Spark does for free.",
        blocks: [
          { kind: "code", code: `orders.join(customers, on="customer_id", how="inner")

orders.join(
    customers,
    orders.customer_id == customers.id,
    how="left",
)

# Broadcast a small side to skip the shuffle
from pyspark.sql.functions import broadcast
orders.join(broadcast(countries), "country_code")` },
          { kind: "list", items: [
            "how: inner, left, right, full, left_semi, left_anti, cross.",
            "Semi = rows in left that have a match; anti = rows in left with NO match.",
            "broadcast() ships the small DataFrame to every executor — huge speedup when one side is < ~10 MB.",
          ] },
        ],
        takeaways: [
          "Standard joins shuffle both sides on the join key.",
          "Broadcast joins skip the shuffle when one side is small.",
          "Semi/anti joins are the clean way to say 'filter by existence in another table'.",
        ],
      }),
      L({
        id: "spark-sql",
        title: "Spark SQL",
        tagline: "Every DataFrame op is also an SQL query — and you can mix both freely.",
        blocks: [
          { kind: "code", code: `df.createOrReplaceTempView("orders")

top = spark.sql("""
    SELECT country, SUM(amount) AS revenue
    FROM orders
    WHERE created_at >= '2024-01-01'
    GROUP BY country
    ORDER BY revenue DESC
    LIMIT 10
""")

top.show()` },
          { kind: "callout", tone: "note", text: "spark.sql returns a DataFrame. You can .filter() or .join() it further exactly like any other DataFrame — SQL and the DataFrame API are two views of the same plan." },
        ],
        takeaways: [
          "createOrReplaceTempView exposes a DataFrame to SQL by name.",
          "spark.sql(...) → DataFrame; the two APIs interoperate freely.",
          "Use SQL for exploration, the DataFrame API for reusable pipelines.",
        ],
      }),
    ],
  },
  {
    id: "internals",
    title: "3 · Under the hood",
    color: "var(--purple)",
    lessons: [
      L({
        id: "partitions",
        title: "Partitions",
        tagline: "The unit of parallelism — one partition = one task per stage.",
        scene: "partitions",
        blocks: [
          { kind: "p", text: "A DataFrame is split into partitions. Spark launches one task per partition per stage. Too few partitions and cores sit idle; too many and scheduling overhead dominates." },
          { kind: "code", code: `df.rdd.getNumPartitions()          # inspect

df.repartition(200)                # full shuffle, exact count
df.repartition("country")          # shuffle so same country co-locates
df.coalesce(10)                    # merge partitions, no shuffle

spark.conf.set("spark.sql.shuffle.partitions", 200)  # default after a shuffle` },
          { kind: "callout", tone: "tip", text: "A good starting rule: aim for partitions of ~100-200 MB each. On a 100 GB dataset that's 500-1000 partitions." },
        ],
        takeaways: [
          "Partitions are the unit of parallelism — 1 partition = 1 task.",
          "repartition() causes a shuffle; coalesce() only merges (cheap).",
          "spark.sql.shuffle.partitions controls partition count after a shuffle (default 200).",
        ],
      }),
      L({
        id: "jobs-stages-tasks",
        title: "Jobs, Stages & Tasks",
        tagline: "How one action becomes a DAG that becomes work on executors.",
        scene: "dagStages",
        blocks: [
          { kind: "p", text: "When you fire an action, Spark builds a DAG of transformations, cuts it at every shuffle boundary into stages, and then launches one task per partition in each stage." },
          { kind: "list", items: [
            "Job — one per action (show, count, write, collect).",
            "Stage — a run of transformations with no shuffle between them.",
            "Task — one stage running on one partition on one executor.",
          ] },
          { kind: "callout", tone: "note", text: "The Spark UI (http://localhost:4040 by default) shows the full DAG for every job. It's the single most useful debugging tool you have." },
        ],
        takeaways: [
          "1 action → 1 job → N stages → many tasks.",
          "Stage boundaries are shuffle boundaries.",
          "The Spark UI is the ground truth for what actually ran.",
        ],
      }),
      L({
        id: "shuffle",
        title: "The Shuffle",
        tagline: "The expensive redistribution of data across the network — and how to avoid it.",
        scene: "shuffle",
        blocks: [
          { kind: "p", text: "Any operation that needs to co-locate rows by key — groupBy, join, distinct, window, repartition — has to shuffle: every executor writes intermediate files, then every executor on the next stage reads the pieces it needs." },
          { kind: "code", code: `# Watch for these operators in the query plan — each is a shuffle
df.groupBy("country").agg(...)     # HashAggregate + Exchange
df.join(other, "id")               # SortMergeJoin + Exchange
df.distinct()                      # Aggregate + Exchange
df.repartition(64, "user_id")      # Exchange

# Broadcast small sides to skip the shuffle entirely
df.join(F.broadcast(small_dim), "key")` },
          { kind: "callout", tone: "warn", text: "Shuffles are usually the #1 performance cost. Cut them by broadcasting small tables, filtering early, and pre-partitioning frequently-joined data." },
        ],
        takeaways: [
          "Shuffle = disk write on the sender + network read on the receiver.",
          "Broadcast joins and partition pruning are the biggest wins.",
          "explain() shows every Exchange (= shuffle) in the plan.",
        ],
      }),
      L({
        id: "catalyst-and-tungsten",
        title: "Catalyst & Tungsten",
        tagline: "Why DataFrame code often beats hand-written RDD code.",
        blocks: [
          { kind: "p", text: "Catalyst is Spark's query optimizer. It rewrites your DataFrame plan: pushing filters into the file scan, pruning unused columns, reordering joins, combining projections. Tungsten is the execution layer that turns the optimized plan into cache-friendly, whole-stage-code-generated bytecode." },
          { kind: "code", code: `df.explain(mode="formatted")

# == Physical Plan ==
# * HashAggregate(keys=[country], functions=[sum(amount)])
#   +- Exchange hashpartitioning(country, 200)
#      +- * HashAggregate(keys=[country], functions=[partial_sum(amount)])
#         +- * Project [country, amount]
#            +- * Filter (amount > 100)
#               +- FileScan parquet [country, amount] PushedFilters: [GreaterThan(amount, 100)]` },
          { kind: "callout", tone: "tip", text: "The '*' in the physical plan means whole-stage code generation is active — Spark fused those operators into a single tight loop." },
        ],
        takeaways: [
          "Catalyst optimizes; Tungsten executes on efficient binary memory.",
          "df.explain() is the fastest way to see if predicates and columns are being pushed down.",
          "Prefer the DataFrame API so you get these optimizations for free.",
        ],
      }),
      L({
        id: "cache-and-persist",
        title: "Cache & Persist",
        tagline: "Materialize a DataFrame once and reuse it across many actions.",
        scene: "cache",
        blocks: [
          { kind: "code", code: `from pyspark import StorageLevel

base = (spark.read.parquet("/data/big")
                 .filter("year = 2024")
                 .repartition("country"))

base.cache()                                   # MEMORY_AND_DISK by default
# or explicitly:
base.persist(StorageLevel.MEMORY_AND_DISK_SER)

base.count()          # materializes and stores partitions
base.groupBy(...).show()   # now fast — no re-scan

base.unpersist()      # free memory when you're done` },
          { kind: "list", items: [
            "MEMORY_ONLY — fastest, evicted under pressure.",
            "MEMORY_AND_DISK — default, spills to disk when memory is tight.",
            "*_SER variants — serialized, smaller footprint, slightly slower to read.",
          ] },
          { kind: "callout", tone: "warn", text: "Caching is not free — it uses executor memory. Only cache DataFrames you'll reuse at least twice, and unpersist when you're done." },
        ],
        takeaways: [
          "cache() = persist(MEMORY_AND_DISK).",
          "The DataFrame is only materialized on the next action.",
          "Always unpersist() to release memory in long-running apps.",
        ],
      }),
    ],
  },
  {
    id: "advanced",
    title: "4 · Advanced",
    color: "var(--teal)",
    lessons: [
      L({
        id: "window-functions",
        title: "Window Functions",
        tagline: "Row-by-row calculations that need context — running totals, ranks, lags.",
        blocks: [
          { kind: "code", code: `from pyspark.sql import Window
from pyspark.sql import functions as F

w = Window.partitionBy("customer_id").orderBy("created_at")

enriched = (df
    .withColumn("order_no", F.row_number().over(w))
    .withColumn("prev_amount", F.lag("amount").over(w))
    .withColumn(
        "rolling_7",
        F.sum("amount").over(w.rowsBetween(-6, 0)),
    )
)` },
          { kind: "list", items: [
            "row_number, rank, dense_rank — ordering.",
            "lag, lead — look at the previous / next row.",
            "sum / avg / min / max over a Window — rolling stats.",
            "rowsBetween(-6, 0) — the last 7 rows including this one.",
          ] },
        ],
        takeaways: [
          "Window = partitionBy (group) + orderBy (sort inside group) + optional frame.",
          "One shuffle per unique Window spec — reuse Window objects where possible.",
        ],
      }),
      L({
        id: "udfs-and-pandas",
        title: "UDFs & pandas UDFs",
        tagline: "When built-in functions aren't enough — and how to keep it fast.",
        scene: "parallelTasks",
        blocks: [
          { kind: "p", text: "A Python UDF ships each row to the Python interpreter — correct, but 10-100× slower than a built-in function. A pandas UDF ships whole Arrow batches to a vectorized pandas function, closing most of the gap." },
          { kind: "code", code: `from pyspark.sql import functions as F
from pyspark.sql.types import DoubleType
import pandas as pd

# Regular Python UDF — slow
@F.udf(DoubleType())
def celsius(f):
    return (f - 32) * 5.0 / 9.0

# pandas UDF — vectorized, uses Apache Arrow
@F.pandas_udf(DoubleType())
def celsius_fast(f: pd.Series) -> pd.Series:
    return (f - 32) * 5.0 / 9.0

df.withColumn("c", celsius_fast("temp_f"))` },
          { kind: "callout", tone: "warn", text: "Always check for a built-in first. F.expr, F.when, F.regexp_extract and friends cover 90% of what people write UDFs for." },
        ],
        takeaways: [
          "Prefer built-in functions → pandas UDF → plain Python UDF, in that order.",
          "pandas UDFs need PyArrow installed on every executor.",
          "UDFs are opaque to Catalyst — it can't push filters through them.",
        ],
      }),
      L({
        id: "structured-streaming",
        title: "Structured Streaming",
        tagline: "The same DataFrame API — but the table keeps growing.",
        scene: "pipeline",
        blocks: [
          { kind: "p", text: "Structured Streaming treats a stream as a table that never stops appending. You write the same DataFrame code; Spark runs it incrementally on each micro-batch." },
          { kind: "code", code: `events = (spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "broker:9092")
    .option("subscribe", "orders")
    .load()
    .selectExpr("CAST(value AS STRING) AS json"))

parsed = events.select(F.from_json("json", schema).alias("o")).select("o.*")

per_minute = (parsed
    .withWatermark("ts", "10 minutes")
    .groupBy(F.window("ts", "1 minute"), "country")
    .agg(F.sum("amount").alias("revenue")))

query = (per_minute.writeStream
    .outputMode("update")
    .format("console")
    .trigger(processingTime="30 seconds")
    .start())

query.awaitTermination()` },
          { kind: "callout", tone: "tip", text: "withWatermark tells Spark how late events can arrive, so it can drop old state and keep aggregations bounded." },
        ],
        takeaways: [
          "Streams = unbounded DataFrames; same API, same optimizer.",
          "Watermarks bound state so aggregates don't grow forever.",
          "outputMode: append (new rows only), update (changed rows), complete (whole result).",
        ],
      }),
      L({
        id: "cluster-and-deploy",
        title: "Running on a Cluster",
        tagline: "From spark-submit flags to why your job is slow.",
        scene: "cluster",
        blocks: [
          { kind: "code", caption: "shell", code: `spark-submit \\
    --master yarn \\
    --deploy-mode cluster \\
    --num-executors 20 \\
    --executor-cores 4 \\
    --executor-memory 8g \\
    --conf spark.sql.shuffle.partitions=400 \\
    --conf spark.sql.adaptive.enabled=true \\
    my_job.py` },
          { kind: "list", items: [
            "num-executors × executor-cores = total parallel tasks.",
            "executor-memory is split between execution, storage (cache) and overhead.",
            "spark.sql.adaptive.enabled=true lets Spark re-optimize at runtime — turn it on.",
            "Cluster managers: YARN, Kubernetes, Standalone, Mesos (deprecated).",
          ] },
          { kind: "callout", tone: "note", text: "The 3D scene shows hundreds of tasks orbiting a few carrier executors — Spark's scheduler multiplexes many tasks onto a small pool of cores." },
        ],
        takeaways: [
          "Right-size executors: too big = wasted cores, too small = overhead.",
          "Adaptive Query Execution (AQE) auto-tunes shuffle partitions and join strategies.",
          "Always start from the Spark UI when a job is slow — don't guess.",
        ],
      }),
      L({
        id: "performance-tips",
        title: "Performance Playbook",
        tagline: "The checklist to run through before every tuning session.",
        scene: "cache",
        blocks: [
          { kind: "list", items: [
            "Read only the columns you need — Parquet + select() enables column pruning.",
            "Filter as early as possible — Catalyst pushes predicates into the scan.",
            "Broadcast small dimensions instead of shuffling them.",
            "Watch out for data skew — one huge key can stall a stage. Salt the key or use skew hints.",
            "Cache reused intermediates; unpersist when done.",
            "Prefer built-in functions over UDFs.",
            "Turn on AQE (spark.sql.adaptive.enabled=true) — free wins.",
            "Right-size spark.sql.shuffle.partitions for your data volume.",
          ] },
          { kind: "callout", tone: "tip", text: "The single fastest debugging move: open the Spark UI, sort stages by duration, and click the slowest one. 90% of tuning starts there." },
        ],
        takeaways: [
          "Most PySpark performance work is about reducing shuffle and skew.",
          "The Spark UI answers 'where is time going?' faster than any code review.",
          "Adaptive Query Execution is free — enable it everywhere.",
        ],
      }),
    ],
  },
];

export function findLesson(moduleId: string, lessonId: string) {
  const mod = modules.find((m) => m.id === moduleId);
  const lesson = mod?.lessons.find((l) => l.id === lessonId);
  return mod && lesson ? { module: mod, lesson } : null;
}

export function flatLessons() {
  return modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
}

export function neighbours(moduleId: string, lessonId: string) {
  const flat = flatLessons();
  const i = flat.findIndex((x) => x.module.id === moduleId && x.lesson.id === lessonId);
  return {
    prev: i > 0 ? flat[i - 1] : null,
    next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null,
    index: i,
    total: flat.length,
  };
}