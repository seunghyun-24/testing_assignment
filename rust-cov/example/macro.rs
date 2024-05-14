macro_rules! repeat {
    ($expr:expr; $count:expr) => {
        {
            let mut result = Vec::new();
            for _ in 0..$count {
                result.push($expr);
            }
            result
        }
    };
}

macro_rules! debug {
    ($var:expr) => {
        println!("{} = {:?}", stringify!($var), $var);
    };
}

macro_rules! sort {
    ($arr:expr) => {{
        let mut arr = $arr;
        arr.sort();
        arr
    }};
}

fn main() {

    let values = repeat!(42; 5); // [42, 42, 42, 42, 42]
    println!("{:?}", values);

    let x = 10;
    let y = "hello";
    debug!(x);
    debug!(y);

    let mut numbers = vec![4, 2, 7, 5, 1];
    numbers = sort!(numbers); // [1, 2, 4, 5, 7]
    println!("{:?}", numbers);
}

// 와 매크로는 좀 신기하게 돌아가네 어떻게 측정하는거지?